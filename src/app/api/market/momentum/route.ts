import OpenAI from "openai"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const schema = z.object({
  stocks: z.array(z.object({
    ticker: z.string(),
    name: z.string(),
    price: z.number(),
    changePercent: z.number(),
    volume: z.number(),
    avgVolume: z.number().optional(),
    high52w: z.number().optional(),
    low52w: z.number().optional(),
    rsi: z.number().nullable().optional(),
  })).min(1).max(30),
})

const SYSTEM_PROMPT = `당신은 기술적 모멘텀 분석 전문가입니다. 종목 데이터에서 브레이크아웃 신호를 감지하세요.

반환 형식 (JSON만):
{
  "breakouts": [
    {
      "ticker": "코드",
      "name": "종목명",
      "type": "52w_high" | "volume_breakout" | "golden_cross" | "oversold_bounce" | "trend_acceleration",
      "strength": 1~5,
      "title": "신호 제목",
      "description": "설명 1문장",
      "action": "주목" | "매수 검토" | "관망"
    }
  ],
  "marketMomentum": "강세" | "약세" | "중립",
  "summary": "오늘의 모멘텀 요약 1~2문장"
}

감지 기준:
- 52w_high: 52주 신고가 근접 (5% 이내) 또는 갱신
- volume_breakout: 거래량 평균 대비 2배 이상 + 양봉
- golden_cross: (RSI 30 이하에서 반등 패턴)
- oversold_bounce: RSI 30 이하 과매도 후 반등
- trend_acceleration: 연속 3일 이상 상승 + 거래량 증가
- strength 5가 가장 강한 신호
- 신호 없으면 빈 배열
- 반드시 유효한 JSON만`

export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "잘못된 요청" }, { status: 400 })
    }

    const stockText = parsed.data.stocks.map((s) =>
      `${s.name}(${s.ticker}): 가격=${s.price.toLocaleString()}, 등락=${s.changePercent.toFixed(1)}%, 거래량=${s.volume.toLocaleString()}${s.avgVolume ? `(평균${s.avgVolume.toLocaleString()})` : ""}${s.high52w ? `, 52주고=${s.high52w.toLocaleString()}` : ""}${s.low52w ? `, 52주저=${s.low52w.toLocaleString()}` : ""}${s.rsi != null ? `, RSI=${s.rsi.toFixed(0)}` : ""}`
    ).join("\n")

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `모멘텀 브레이크아웃을 분석해주세요:\n\n${stockText}` },
      ],
      temperature: 0.1,
      max_tokens: 1200,
    })

    const content = completion.choices[0]?.message?.content?.trim()
    if (!content) {
      return NextResponse.json({ success: false, error: "AI 응답 없음" }, { status: 500 })
    }
    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    try {
      return NextResponse.json({ success: true, data: JSON.parse(cleaned) })
    } catch {
      return NextResponse.json({ success: false, error: "AI 응답 파싱 실패" }, { status: 500 })
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "알 수 없는 오류"
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
