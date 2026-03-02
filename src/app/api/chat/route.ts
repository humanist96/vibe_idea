import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextRequest } from "next/server"
import { orchestrate } from "@/lib/chat/orchestrator"
import { getDisclaimer } from "@/lib/chat/compliance"

export const maxDuration = 60

interface ChatRequestBody {
  readonly messages: readonly {
    readonly role: "user" | "assistant"
    readonly content: string
  }[]
  readonly watchlistTickers?: readonly string[]
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ChatRequestBody
    const { messages, watchlistTickers = [] } = body

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
    const result = await orchestrate(lastMessage.content, watchlistTickers)

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

    // Gemini API 직접 스트리밍
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY가 설정되지 않았습니다." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: {
        role: "user",
        parts: [{ text: systemPrompt }],
      },
    })

    // 대화 이력 구성
    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? ("model" as const) : ("user" as const),
      parts: [{ text: m.content }],
    }))

    const chat = model.startChat({ history })
    const streamResult = await chat.sendMessageStream(lastMessage.content)

    // ReadableStream으로 변환
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamResult.stream) {
            const text = chunk.text()
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
    const detail = error instanceof Error ? error.message : String(error)
    return new Response(
      JSON.stringify({ error: "채팅 처리 중 오류가 발생했습니다.", detail }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
