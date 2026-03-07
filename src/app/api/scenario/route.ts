import OpenAI from "openai"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const schema = z.object({
  scenario: z.string().min(3).max(200),
  portfolio: z.array(
    z.object({
      name: z.string(),
      ticker: z.string(),
      sector: z.string(),
      market: z.enum(["KR", "US"]),
      weight: z.number(),
      currentValue: z.number(),
    })
  ).optional(),
})

const SYSTEM_PROMPT = `당신은 투자 시나리오 시뮬레이션 전문가입니다. 사용자가 제시한 가상 시나리오가 포트폴리오와 시장에 미치는 영향을 분석하세요.

반환 형식 (JSON만):
{
  "scenario": "시나리오 요약",
  "probability": "높음" | "중간" | "낮음",
  "overallImpact": "매우 긍정" | "긍정" | "중립" | "부정" | "매우 부정",
  "portfolioImpact": {
    "estimatedChange": -10~+10 (예상 포트폴리오 변동률 %),
    "comment": "포트폴리오 영향 설명 1~2문장"
  },
  "sectorImpacts": [
    { "sector": "섹터명", "impact": "수혜" | "피해" | "중립", "reason": "1문장" }
  ],
  "stockImpacts": [
    { "name": "종목명", "ticker": "코드", "impact": "수혜" | "피해" | "중립", "estimatedChange": -20~+20, "reason": "1문장" }
  ],
  "hedgingStrategies": [
    "헤지 전략 1",
    "헤지 전략 2"
  ],
  "historicalReference": "과거 유사 사례 1문장",
  "summary": "시나리오 시뮬레이션 요약 2~3문장"
}

반드시 유효한 JSON만 응답.`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "잘못된 요청 형식입니다." },
        { status: 400 }
      )
    }

    const { scenario, portfolio } = parsed.data
    const parts = [`시나리오: ${scenario}`]

    if (portfolio && portfolio.length > 0) {
      parts.push("\n포트폴리오:")
      for (const item of portfolio) {
        parts.push(`- ${item.name}(${item.ticker}): ${item.sector}(${item.market}), 비중 ${item.weight.toFixed(1)}%, 평가금액 ${item.currentValue.toLocaleString()}원`)
      }
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `다음 시나리오의 영향을 시뮬레이션해주세요.\n\n${parts.join("\n")}` },
      ],
      temperature: 0.4,
      max_tokens: 800,
    })

    const content = completion.choices[0]?.message?.content?.trim()
    if (!content) {
      return NextResponse.json(
        { success: false, error: "AI 응답을 받지 못했습니다." },
        { status: 500 }
      )
    }

    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    const result = JSON.parse(cleaned)

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류"
    return NextResponse.json(
      { success: false, error: `시나리오 분석 실패: ${message}` },
      { status: 500 }
    )
  }
}
