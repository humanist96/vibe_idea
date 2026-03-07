import OpenAI from "openai"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const schema = z.object({
  ticker: z.string(),
  name: z.string(),
  currentPrice: z.number(),
  per: z.number().nullable().optional(),
  pbr: z.number().nullable().optional(),
  eps: z.number().nullable().optional(),
  bps: z.number().nullable().optional(),
  dividendYield: z.number().nullable().optional(),
  marketCap: z.number().optional(),
  sector: z.string().optional(),
  revenue: z.number().nullable().optional(),
  netIncome: z.number().nullable().optional(),
})

const SYSTEM_PROMPT = `당신은 주식 적정가치 분석 전문가입니다. 주어진 데이터로 3가지 방법론을 사용해 적정주가를 산출하세요.

반환 형식 (JSON만):
{
  "fairValue": {
    "dcf": { "price": 숫자, "upside": 퍼센트, "assumptions": "핵심 가정 1문장" },
    "perBased": { "price": 숫자, "upside": 퍼센트, "peerAvgPer": 숫자, "assumptions": "1문장" },
    "pbrBased": { "price": 숫자, "upside": 퍼센트, "peerAvgPbr": 숫자, "assumptions": "1문장" }
  },
  "consensus": {
    "bear": 숫자,
    "base": 숫자,
    "bull": 숫자
  },
  "verdict": "저평가" | "적정가" | "고평가",
  "confidence": "높음" | "보통" | "낮음",
  "keyDrivers": ["핵심 가치 드라이버 1", "드라이버 2", "드라이버 3"],
  "risks": ["밸류에이션 리스크 1", "리스크 2"],
  "summary": "적정가치 분석 요약 2~3문장"
}

규칙:
- DCF는 보수적 성장률 가정 (GDP+α)
- PER 기반은 동일 섹터 평균 PER 적용
- PBR 기반은 동일 섹터 평균 PBR 적용
- consensus의 bear/base/bull은 세 방법론의 범위 기반
- 데이터 부족 시 confidence를 "낮음"으로
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
      s.per != null ? `PER: ${s.per}` : null,
      s.pbr != null ? `PBR: ${s.pbr}` : null,
      s.eps != null ? `EPS: ${s.eps.toLocaleString()}` : null,
      s.bps != null ? `BPS: ${s.bps.toLocaleString()}` : null,
      s.dividendYield != null ? `배당률: ${s.dividendYield}%` : null,
      s.marketCap ? `시가총액: ${s.marketCap.toLocaleString()}` : null,
      s.revenue != null ? `매출: ${s.revenue.toLocaleString()}` : null,
      s.netIncome != null ? `순이익: ${s.netIncome.toLocaleString()}` : null,
    ].filter(Boolean).join("\n")

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `적정주가를 산출해주세요.\n\n${parts}` },
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
