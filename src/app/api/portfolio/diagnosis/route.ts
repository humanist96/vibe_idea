import OpenAI from "openai"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const schema = z.object({
  holdings: z.array(
    z.object({
      ticker: z.string(),
      name: z.string(),
      market: z.enum(["KR", "US"]),
      sectorKr: z.string(),
      quantity: z.number(),
      avgPrice: z.number(),
      currentPrice: z.number(),
      changePercent: z.number(),
    })
  ),
})

const SYSTEM_PROMPT = `당신은 전문 포트폴리오 진단 AI입니다. 사용자의 보유 종목 데이터를 분석하고 진단 결과를 JSON으로 반환하세요.

반환 형식 (JSON만, 다른 텍스트 없이):
{
  "overallScore": 1~100 (포트폴리오 종합 점수),
  "grade": "A+" | "A" | "B+" | "B" | "C+" | "C" | "D",
  "diversification": {
    "score": 1~100,
    "comment": "분산 투자 평가 코멘트 (1~2문장)"
  },
  "riskLevel": {
    "score": 1~100 (높을수록 위험),
    "comment": "리스크 평가 코멘트 (1~2문장)"
  },
  "profitability": {
    "score": 1~100,
    "comment": "수익성 평가 코멘트 (1~2문장)"
  },
  "sectorAnalysis": [
    { "sector": "섹터명", "weight": 비중(%), "status": "적정" | "과다" | "부족" }
  ],
  "warnings": [
    "경고 메시지 1",
    "경고 메시지 2"
  ],
  "recommendations": [
    "추천 사항 1",
    "추천 사항 2",
    "추천 사항 3"
  ],
  "summary": "3~4문장의 포트폴리오 종합 진단 요약"
}

분석 기준:
- 섹터 편중: 단일 섹터 50% 이상이면 "과다", 30~50%이면 주의
- 종목 집중: 단일 종목이 전체의 40% 이상이면 경고
- 시장 분산: KR/US 혼합 시 가점, 단일 시장이면 중립
- 수익률: 전체 평균 수익률 기반 (양수면 가점, 음수면 감점)
- 종목 수: 3~10개 적정, 2개 이하 부족, 15개 이상 과다

반드시 유효한 JSON만 응답하세요.`

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

    const { holdings } = parsed.data

    if (holdings.length === 0) {
      return NextResponse.json(
        { success: false, error: "보유 종목이 없습니다." },
        { status: 400 }
      )
    }

    const holdingsText = holdings.map((h) => {
      const totalCost = h.quantity * h.avgPrice
      const totalValue = h.quantity * h.currentPrice
      const pnl = totalValue - totalCost
      const pnlPercent = totalCost > 0 ? ((pnl / totalCost) * 100).toFixed(1) : "0"
      return `- ${h.name}(${h.ticker}): 시장=${h.market}, 섹터=${h.sectorKr || "미분류"}, 수량=${h.quantity}, 평균단가=${h.avgPrice.toLocaleString()}, 현재가=${h.currentPrice.toLocaleString()}, 수익률=${pnlPercent}%, 평가금액=${totalValue.toLocaleString()}`
    }).join("\n")

    const totalValue = holdings.reduce((sum, h) => sum + h.quantity * h.currentPrice, 0)
    const totalCost = holdings.reduce((sum, h) => sum + h.quantity * h.avgPrice, 0)
    const overallPnlPercent = totalCost > 0 ? (((totalValue - totalCost) / totalCost) * 100).toFixed(1) : "0"

    const userMessage = `포트폴리오 진단을 요청합니다.

보유 종목 (${holdings.length}개):
${holdingsText}

총 투자금: ${totalCost.toLocaleString()}원
총 평가금: ${totalValue.toLocaleString()}원
전체 수익률: ${overallPnlPercent}%`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    })

    const content = completion.choices[0]?.message?.content?.trim()
    if (!content) {
      return NextResponse.json(
        { success: false, error: "AI 응답을 받지 못했습니다." },
        { status: 500 }
      )
    }

    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    const diagnosis = JSON.parse(cleaned)

    return NextResponse.json({ success: true, data: diagnosis })
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류"
    return NextResponse.json(
      { success: false, error: `진단 실패: ${message}` },
      { status: 500 }
    )
  }
}
