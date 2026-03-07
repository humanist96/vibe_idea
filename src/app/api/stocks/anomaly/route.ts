import OpenAI from "openai"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const schema = z.object({
  stocks: z.array(
    z.object({
      ticker: z.string(),
      name: z.string(),
      price: z.number(),
      changePercent: z.number(),
      volume: z.number(),
      avgVolume: z.number().optional(),
      per: z.number().nullable().optional(),
      pbr: z.number().nullable().optional(),
      foreignRate: z.number().nullable().optional(),
    })
  ).min(1).max(20),
})

const SYSTEM_PROMPT = `당신은 주식 이상 신호 감지 전문가입니다. 종목 데이터에서 이상 징후를 탐지하세요.

반환 형식 (JSON만):
{
  "anomalies": [
    {
      "ticker": "종목코드",
      "name": "종목명",
      "type": "volume_spike" | "price_surge" | "price_crash" | "valuation_extreme" | "foreign_flow",
      "severity": "high" | "medium" | "low",
      "title": "이상 신호 제목 (짧게)",
      "description": "설명 1문장",
      "emoji": "적절한 이모지"
    }
  ],
  "totalAlerts": 감지된 이상 신호 수
}

감지 기준:
- volume_spike: 거래량이 평소(avgVolume)의 2배 이상
- price_surge: 일일 등락률 +5% 이상
- price_crash: 일일 등락률 -5% 이하
- valuation_extreme: PER이 3 이하(극저평가) 또는 100 이상(극고평가), PBR 0.3 이하
- foreign_flow: 외국인 비율이 극단적(50% 이상 또는 1% 이하)
- 이상 신호가 없으면 빈 배열 반환
- severity: high(긴급), medium(주의), low(참고)
- 반드시 유효한 JSON만`

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

    const { stocks } = parsed.data

    const stockText = stocks.map((s) =>
      `${s.name}(${s.ticker}): 현재가=${s.price.toLocaleString()}, 등락률=${s.changePercent.toFixed(1)}%, 거래량=${s.volume.toLocaleString()}${s.avgVolume ? `, 평균거래량=${s.avgVolume.toLocaleString()}` : ""}${s.per != null ? `, PER=${s.per}` : ""}${s.pbr != null ? `, PBR=${s.pbr}` : ""}${s.foreignRate != null ? `, 외국인=${s.foreignRate}%` : ""}`
    ).join("\n")

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `다음 관심종목들의 이상 신호를 감지해주세요:\n\n${stockText}` },
      ],
      temperature: 0.1,
      max_tokens: 600,
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
      { success: false, error: `이상 감지 실패: ${message}` },
      { status: 500 }
    )
  }
}
