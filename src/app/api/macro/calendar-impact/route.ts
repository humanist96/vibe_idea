import OpenAI from "openai"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const schema = z.object({
  events: z.array(z.object({
    date: z.string(),
    name: z.string(),
    country: z.string().optional(),
    previous: z.string().optional(),
    forecast: z.string().optional(),
    actual: z.string().optional(),
  })).min(1).max(20),
  portfolio: z.array(z.object({
    ticker: z.string(),
    name: z.string(),
    sector: z.string().optional(),
  })).optional(),
})

const SYSTEM_PROMPT = `당신은 경제 지표/이벤트 영향 분석 전문가입니다. 경제 캘린더의 주요 일정이 시장과 포트폴리오에 미칠 영향을 분석하세요.

반환 형식 (JSON만):
{
  "events": [
    {
      "date": "날짜",
      "name": "이벤트명",
      "importance": "높음" | "보통" | "낮음",
      "expectedImpact": "시장 영향 1문장",
      "affectedSectors": ["영향받는 섹터"],
      "scenario": {
        "positive": "긍정 시나리오 1문장",
        "negative": "부정 시나리오 1문장"
      }
    }
  ],
  "weekRiskLevel": "높음" | "보통" | "낮음",
  "portfolioAlerts": [
    { "ticker": "코드", "name": "종목명", "event": "관련 이벤트", "risk": "1문장" }
  ],
  "tradingStrategy": "이번 주 대응 전략 2~3문장",
  "summary": "경제 캘린더 요약 1~2문장"
}

분석 기준:
- FOMC, 고용지표, CPI는 높은 중요도
- 포트폴리오 보유 종목과의 연관성 분석
- 반드시 유효한 JSON만`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "잘못된 요청" }, { status: 400 })
    }

    const eventText = parsed.data.events.map((e) =>
      `${e.date} | ${e.country ?? ""} | ${e.name}${e.previous ? ` | 이전=${e.previous}` : ""}${e.forecast ? ` | 예상=${e.forecast}` : ""}${e.actual ? ` | 실제=${e.actual}` : ""}`
    ).join("\n")

    let portfolioText = ""
    if (parsed.data.portfolio?.length) {
      portfolioText = `\n\n[보유 포트폴리오]\n${parsed.data.portfolio.map(p => `${p.name}(${p.ticker})${p.sector ? ` - ${p.sector}` : ""}`).join("\n")}`
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `경제 캘린더 영향을 분석해주세요:\n\n${eventText}${portfolioText}` },
      ],
      temperature: 0.2,
      max_tokens: 1500,
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
