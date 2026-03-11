import OpenAI from "openai"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { STOCK_LIST } from "@/lib/constants/stocks"
import { getAllUSStocks } from "@/lib/data/us-stock-registry"
import { auth } from "../../../../../auth"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const recommendResponseSchema = z.object({
  recommendations: z.array(z.object({
    ticker: z.string(),
    name: z.string(),
    market: z.enum(["KR", "US"]),
    dividendYield: z.number(),
    reason: z.string(),
    suggestedWeight: z.number(),
  })),
  strategy_summary: z.string().optional(),
})

const schema = z.object({
  strategy: z
    .enum([
      "high-yield",
      "growth",
      "safety",
      "aristocrat",
      "monthly-income",
      "balanced",
    ])
    .default("balanced"),
  targetYield: z.number().min(0).max(20).optional(),
  budget: z.number().int().min(1).optional(),
  existingTickers: z.array(z.string()).default([]),
  markets: z.array(z.enum(["KR", "US"])).default(["KR", "US"]),
  count: z.number().int().min(1).max(10).default(5),
})

function buildTickerList(markets: readonly string[]): string {
  const lines: string[] = []

  if (markets.includes("KR")) {
    const krStocks = STOCK_LIST.slice(0, 60)
      .map((s) => `${s.ticker}(${s.name}, ${s.sector})`)
      .join(", ")
    lines.push(`[국내] ${krStocks}`)
  }

  if (markets.includes("US")) {
    const usStocks = getAllUSStocks()
      .map((s) => `${s.symbol}(${s.nameKr}, ${s.sectorKr})`)
      .join(", ")
    lines.push(`[미국] ${usStocks}`)
  }

  return lines.join("\n")
}

const SYSTEM_PROMPT = `당신은 배당 투자 종목 추천 전문가입니다.
주어진 종목 목록에서만 추천하세요. 목록에 없는 종목은 절대 추천하지 마세요.

반환 형식 (JSON만):
{
  "recommendations": [
    {
      "ticker": "종목코드",
      "name": "종목명",
      "market": "KR" | "US",
      "dividendYield": 추정배당률,
      "reason": "추천 이유 1~2문장",
      "suggestedWeight": 추천비중(%)
    }
  ],
  "strategy_summary": "전략 요약 1문장"
}

규칙:
- 추천 비중의 합은 100%
- 기존 보유 종목은 제외
- 섹터 분산 고려
- 국내/해외 혼합 시 적절한 비중 배분
- 반드시 유효한 JSON만 출력`

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "로그인이 필요합니다." },
        { status: 401 }
      )
    }

    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "잘못된 요청" },
        { status: 400 }
      )
    }

    const { strategy, targetYield, budget, existingTickers, markets, count } =
      parsed.data

    const tickerList = buildTickerList(markets)

    const userPrompt = [
      `배당 투자 종목을 ${count}개 추천해주세요.`,
      `전략: ${strategy}`,
      targetYield ? `목표 배당률: ${targetYield}%` : null,
      budget ? `투자 예산: ${budget.toLocaleString()}만원` : null,
      existingTickers.length > 0
        ? `기존 보유 종목 (제외): ${existingTickers.join(", ")}`
        : null,
      `\n추천 가능 종목 목록:\n${tickerList}`,
    ]
      .filter(Boolean)
      .join("\n")

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.4,
      max_tokens: 1000,
    })

    const content = completion.choices[0]?.message?.content?.trim()
    if (!content) {
      return NextResponse.json(
        { success: false, error: "AI 응답 없음" },
        { status: 500 }
      )
    }

    const cleaned = content
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim()

    let rawParsed: unknown
    try {
      rawParsed = JSON.parse(cleaned)
    } catch {
      return NextResponse.json(
        { success: false, error: "AI 응답을 파싱할 수 없습니다." },
        { status: 502 }
      )
    }

    const validated = recommendResponseSchema.safeParse(rawParsed)
    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: "AI 응답 형식이 올바르지 않습니다." },
        { status: 502 }
      )
    }

    // 유효 티커 검증
    const validKR = new Set(STOCK_LIST.map((s) => s.ticker))
    const validUS = new Set(getAllUSStocks().map((s) => s.symbol))

    const filteredData = {
      ...validated.data,
      recommendations: validated.data.recommendations.filter(
        (r) => r.market === "KR" ? validKR.has(r.ticker) : validUS.has(r.ticker)
      ),
    }

    return NextResponse.json({ success: true, data: filteredData })
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류"
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
