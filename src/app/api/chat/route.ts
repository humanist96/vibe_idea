import OpenAI from "openai"
import { NextRequest } from "next/server"
import { orchestrate, type Intent } from "@/lib/chat/orchestrator"
import { getDisclaimer } from "@/lib/chat/compliance"
import type { PortfolioItem } from "@/store/portfolio"
import type { ReportSummaryPayload } from "@/lib/chat/intents/report-summary"

/** 분석적 intent에는 GPT-4o, 단순 intent에는 GPT-4o-mini 사용 */
const ANALYTICAL_INTENTS = new Set<Intent>([
  "stock_analysis",
  "us_stock_analysis",
  "stock_comparison",
  "watchlist_review",
  "portfolio_analysis",
  "scenario_analysis",
  "report_summary",
])

function selectModel(intent: Intent): string {
  return ANALYTICAL_INTENTS.has(intent) ? "gpt-4o" : "gpt-4o-mini"
}

export const maxDuration = 60

interface ChatRequestBody {
  readonly messages: readonly {
    readonly role: "user" | "assistant"
    readonly content: string
  }[]
  readonly watchlistTickers?: readonly string[]
  readonly portfolioItems?: readonly PortfolioItem[]
  readonly marketMode?: "kr" | "us"
  readonly latestReportSummary?: ReportSummaryPayload | null
}

/** OpenAI 스트리밍 호출 — 429 시 최대 2회 재시도 */
async function callOpenAIWithRetry(
  client: OpenAI,
  systemPrompt: string,
  history: readonly { role: "user" | "assistant"; content: string }[],
  userMessage: string,
  model = "gpt-4o-mini",
  maxRetries = 2
) {
  let lastError: unknown = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: "system", content: systemPrompt },
        ...history.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        { role: "user" as const, content: userMessage },
      ]

      return await client.chat.completions.create({
        model,
        messages,
        stream: true,
      })
    } catch (error) {
      lastError = error
      const errMsg = error instanceof Error ? error.message : String(error)

      if (errMsg.includes("429") && attempt < maxRetries) {
        const waitSec = Math.min(5 * (attempt + 1), 20)
        console.warn(`OpenAI 429 rate limit, retrying in ${waitSec}s (attempt ${attempt + 1}/${maxRetries})`)
        await new Promise((resolve) => setTimeout(resolve, waitSec * 1000))
        continue
      }

      throw error
    }
  }

  throw lastError
}

/** 에러 메시지에서 사용자 친화적 메시지 추출 */
function getUserFriendlyError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error)

  if (msg.includes("429")) {
    return "AI 서비스 요청 한도에 도달했습니다. 잠시 후 다시 시도해주세요."
  }
  if (msg.includes("API_KEY") || msg.includes("401") || msg.includes("403")) {
    return "AI 서비스 인증에 문제가 발생했습니다."
  }
  if (msg.includes("timeout") || msg.includes("ETIMEDOUT")) {
    return "AI 서비스 응답 시간이 초과되었습니다. 다시 시도해주세요."
  }
  return "채팅 처리 중 오류가 발생했습니다."
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ChatRequestBody
    const {
      messages,
      watchlistTickers = [],
      portfolioItems = [],
      marketMode = "kr",
      latestReportSummary = null,
    } = body

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "메시지가 비어있습니다." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    const lastMessage = messages[messages.length - 1]
    if (lastMessage.role !== "user") {
      return new Response(
        JSON.stringify({ error: "마지막 메시지는 사용자 메시지여야 합니다." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    // 오케스트레이터로 의도 분류 + 데이터 수집
    const result = await orchestrate(
      lastMessage.content,
      watchlistTickers,
      marketMode,
      portfolioItems,
      latestReportSummary ?? null
    )

    // 컴플라이언스 차단 시 — 스트리밍 없이 즉시 응답
    if (result.blocked && result.redirectMessage) {
      const blockedResponse = `${result.redirectMessage}\n\n> ⚠️ ${getDisclaimer(false)}`

      return new Response(
        JSON.stringify({
          blocked: true,
          intent: result.intent,
          message: blockedResponse,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    }

    // 컨텍스트 데이터가 있으면 시스템 프롬프트에 추가
    const systemPrompt = result.contextData
      ? `${result.systemPrompt}\n\n---\n아래는 사용자 질문에 관련된 실시간 데이터입니다. 이 데이터를 기반으로 응답하세요:\n${result.contextData}`
      : result.systemPrompt

    // OpenAI API 키 확인
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY가 설정되지 않았습니다." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    const client = new OpenAI({ apiKey })

    // 대화 이력 구성
    const history = messages.slice(0, -1).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }))

    const model = selectModel(result.intent)

    const streamResult = await callOpenAIWithRetry(
      client,
      systemPrompt,
      history,
      lastMessage.content,
      model
    )

    // ReadableStream으로 변환
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamResult) {
            const text = chunk.choices[0]?.delta?.content
            if (text) {
              controller.enqueue(new TextEncoder().encode(text))
            }
          }
          controller.close()
        } catch (error) {
          console.error("Stream error:", error)
          controller.error(error)
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    })
  } catch (error) {
    console.error("Chat API error:", error)
    return new Response(
      JSON.stringify({ error: getUserFriendlyError(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
