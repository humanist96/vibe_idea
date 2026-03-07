import OpenAI from "openai"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const schema = z.object({
  portfolio: z.array(
    z.object({
      name: z.string(),
      sector: z.string(),
      market: z.enum(["KR", "US"]),
      weight: z.number(),
    })
  ).optional(),
  fearGreedIndex: z.number().optional(),
})

const SYSTEM_PROMPT = `당신은 투자 리스크 분석 전문가입니다. 현재 시장 상황과 포트폴리오를 기반으로 리스크 레이더를 작성하세요.

반환 형식 (JSON만):
{
  "overallRisk": 1~100 (높을수록 위험),
  "riskGrade": "안전" | "주의" | "경계" | "위험" | "심각",
  "dimensions": {
    "macro": { "score": 1~100, "label": "매크로", "comment": "1문장" },
    "valuation": { "score": 1~100, "label": "밸류에이션", "comment": "1문장" },
    "sentiment": { "score": 1~100, "label": "투자심리", "comment": "1문장" },
    "geopolitical": { "score": 1~100, "label": "지정학", "comment": "1문장" },
    "sectorRotation": { "score": 1~100, "label": "섹터 로테이션", "comment": "1문장" }
  },
  "topRisks": [
    { "title": "리스크 제목", "description": "설명 1문장", "severity": "high" | "medium" | "low" }
  ],
  "opportunities": [
    "기회 요인 1",
    "기회 요인 2"
  ],
  "actionItems": [
    "추천 행동 1",
    "추천 행동 2"
  ],
  "summary": "리스크 레이더 요약 2~3문장"
}

2026년 3월 현재 글로벌 경제 상황을 반영하여 분석하세요.
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

    const { portfolio, fearGreedIndex } = parsed.data
    const parts: string[] = []

    if (fearGreedIndex != null) {
      parts.push(`Fear & Greed Index: ${fearGreedIndex}/100`)
    }

    if (portfolio && portfolio.length > 0) {
      parts.push("\n포트폴리오 구성:")
      for (const item of portfolio) {
        parts.push(`- ${item.name}: ${item.sector}(${item.market}), 비중 ${item.weight.toFixed(1)}%`)
      }
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `리스크 레이더를 작성해주세요.\n\n${parts.join("\n") || "포트폴리오 없음 - 시장 전반 리스크 분석"}` },
      ],
      temperature: 0.3,
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
      { success: false, error: `리스크 분석 실패: ${message}` },
      { status: 500 }
    )
  }
}
