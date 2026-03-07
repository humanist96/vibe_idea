import OpenAI from "openai"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const schema = z.object({
  ticker: z.string(),
  name: z.string(),
  currentPrice: z.number(),
  dividendYield: z.number().nullable().optional(),
  dividendPerShare: z.number().nullable().optional(),
  eps: z.number().nullable().optional(),
  payoutRatio: z.number().nullable().optional(),
  fcf: z.number().nullable().optional(),
  debtToEquity: z.number().nullable().optional(),
  sector: z.string().optional(),
  dividendHistory: z.array(z.object({
    year: z.number(),
    amount: z.number(),
  })).optional(),
})

const SYSTEM_PROMPT = `당신은 배당 지속가능성 분석 전문가입니다. 주어진 데이터로 배당의 안정성과 성장 가능성을 평가하세요.

반환 형식 (JSON만):
{
  "sustainabilityScore": 1~100,
  "grade": "A+" | "A" | "B+" | "B" | "C" | "D" | "F",
  "dividendSafety": "매우 안전" | "안전" | "보통" | "위험" | "매우 위험",
  "growthPotential": "높음" | "보통" | "낮음" | "삭감 위험",
  "metrics": {
    "payoutRatio": { "value": 숫자, "status": "양호" | "주의" | "위험", "comment": "1문장" },
    "fcfCoverage": { "value": 숫자, "status": "양호" | "주의" | "위험", "comment": "1문장" },
    "debtLevel": { "value": 숫자, "status": "양호" | "주의" | "위험", "comment": "1문장" },
    "consistency": { "years": 숫자, "trend": "증가" | "유지" | "감소" | "불규칙", "comment": "1문장" }
  },
  "projection": {
    "nextYearEstimate": 숫자,
    "yieldOnCost5yr": 숫자,
    "scenario": "1문장"
  },
  "risks": ["리스크1", "리스크2"],
  "summary": "배당 지속가능성 분석 요약 2~3문장"
}

분석 기준:
- 배당성향 60% 이하 안전, 80% 이상 위험
- FCF 대비 배당 커버리지 1.5배 이상 안전
- 연속 배당 증가 5년 이상 우수
- 부채비율 높으면 배당 삭감 리스크
- 반드시 유효한 JSON만`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "잘못된 요청" }, { status: 400 })
    }

    const s = parsed.data
    const parts = [
      `종목: ${s.name}(${s.ticker})`,
      `현재가: ${s.currentPrice.toLocaleString()}원`,
      s.sector ? `섹터: ${s.sector}` : null,
      s.dividendYield != null ? `배당률: ${s.dividendYield}%` : null,
      s.dividendPerShare != null ? `주당배당: ${s.dividendPerShare.toLocaleString()}원` : null,
      s.eps != null ? `EPS: ${s.eps.toLocaleString()}` : null,
      s.payoutRatio != null ? `배당성향: ${s.payoutRatio}%` : null,
      s.fcf != null ? `FCF: ${s.fcf.toLocaleString()}` : null,
      s.debtToEquity != null ? `부채비율: ${s.debtToEquity}%` : null,
      s.dividendHistory?.length ? `배당이력: ${s.dividendHistory.map(h => `${h.year}년=${h.amount.toLocaleString()}`).join(", ")}` : null,
    ].filter(Boolean).join("\n")

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `배당 지속가능성을 분석해주세요.\n\n${parts}` },
      ],
      temperature: 0.2,
      max_tokens: 700,
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
