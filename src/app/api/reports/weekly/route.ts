import OpenAI from "openai"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const schema = z.object({
  portfolio: z.array(z.object({
    ticker: z.string(),
    name: z.string(),
    changePercent: z.number(),
    currentPrice: z.number(),
  })).optional(),
  marketIndices: z.object({
    kospi: z.object({ value: z.number(), change: z.number() }).optional(),
    kosdaq: z.object({ value: z.number(), change: z.number() }).optional(),
    sp500: z.object({ value: z.number(), change: z.number() }).optional(),
  }).optional(),
  topGainers: z.array(z.object({ name: z.string(), change: z.number() })).optional(),
  topLosers: z.array(z.object({ name: z.string(), change: z.number() })).optional(),
})

const SYSTEM_PROMPT = `당신은 주간 투자 브리핑 전문가입니다. 이번 주 시장과 포트폴리오를 종합 리뷰하세요.

반환 형식 (JSON만):
{
  "weekTitle": "이번 주 한줄 요약 제목",
  "marketReview": {
    "sentiment": "강세" | "약세" | "혼조" | "보합",
    "highlights": ["주요 이벤트 1", "이벤트 2", "이벤트 3"],
    "summary": "시장 리뷰 2~3문장"
  },
  "portfolioReview": {
    "totalReturn": "추정 수익률 문자열",
    "bestPick": { "name": "종목명", "reason": "1문장" },
    "worstPick": { "name": "종목명", "reason": "1문장" },
    "grade": "A" | "B" | "C" | "D" | "F"
  },
  "nextWeekOutlook": {
    "events": ["주요 일정 1", "일정 2"],
    "watchList": ["주목 종목/테마 1", "2"],
    "strategy": "다음 주 전략 제안 1~2문장"
  },
  "actionItems": [
    { "priority": "높음" | "보통", "action": "구체적 행동 1문장" }
  ],
  "quote": "이번 주와 어울리는 투자 명언 1개"
}

반드시 유효한 JSON만`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "잘못된 요청" }, { status: 400 })
    }

    const parts: string[] = []
    const d = parsed.data

    if (d.marketIndices) {
      const idx = d.marketIndices
      const lines = []
      if (idx.kospi) lines.push(`KOSPI: ${idx.kospi.value.toLocaleString()} (${idx.kospi.change > 0 ? "+" : ""}${idx.kospi.change.toFixed(1)}%)`)
      if (idx.kosdaq) lines.push(`KOSDAQ: ${idx.kosdaq.value.toLocaleString()} (${idx.kosdaq.change > 0 ? "+" : ""}${idx.kosdaq.change.toFixed(1)}%)`)
      if (idx.sp500) lines.push(`S&P500: ${idx.sp500.value.toLocaleString()} (${idx.sp500.change > 0 ? "+" : ""}${idx.sp500.change.toFixed(1)}%)`)
      if (lines.length) parts.push(`[지수]\n${lines.join("\n")}`)
    }

    if (d.portfolio?.length) {
      parts.push(`[포트폴리오]\n${d.portfolio.map(p => `${p.name}(${p.ticker}): ${p.currentPrice.toLocaleString()}원 (${p.changePercent > 0 ? "+" : ""}${p.changePercent.toFixed(1)}%)`).join("\n")}`)
    }

    if (d.topGainers?.length) {
      parts.push(`[주간 상승 TOP]\n${d.topGainers.map(g => `${g.name}: +${g.change.toFixed(1)}%`).join("\n")}`)
    }
    if (d.topLosers?.length) {
      parts.push(`[주간 하락 TOP]\n${d.topLosers.map(l => `${l.name}: ${l.change.toFixed(1)}%`).join("\n")}`)
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `이번 주 투자 브리핑을 작성해주세요:\n\n${parts.join("\n\n") || "데이터 없음 - 일반적 시장 리뷰를 해주세요"}` },
      ],
      temperature: 0.3,
      max_tokens: 800,
    })

    const content = completion.choices[0]?.message?.content?.trim()
    if (!content) {
      return NextResponse.json({ success: false, error: "AI 응답 없음" }, { status: 500 })
    }
    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    return NextResponse.json({ success: true, data: JSON.parse(cleaned) })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "알 수 없는 오류"
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
