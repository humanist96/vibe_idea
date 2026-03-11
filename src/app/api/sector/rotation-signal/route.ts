import OpenAI from "openai"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const schema = z.object({
  sectors: z.array(z.object({
    name: z.string(),
    changePercent1w: z.number(),
    changePercent1m: z.number(),
    changePercent3m: z.number().optional(),
    topStocks: z.array(z.string()).optional(),
    avgPer: z.number().nullable().optional(),
  })).min(3),
})

const SYSTEM_PROMPT = `당신은 섹터 로테이션 전략 전문가입니다. 섹터별 성과 데이터를 분석하여 자금 이동 신호를 감지하세요.

반환 형식 (JSON만):
{
  "phase": "회복기" | "확장기" | "과열기" | "침체기",
  "phaseDescription": "현재 경기 국면 설명 1문장",
  "rotationSignal": "강함" | "보통" | "약함",
  "flowDirection": {
    "from": [{ "sector": "섹터명", "signal": "이탈 설명 1문장" }],
    "to": [{ "sector": "섹터명", "signal": "유입 설명 1문장" }]
  },
  "sectorRanking": [
    { "rank": 1, "sector": "섹터명", "momentum": "강세" | "중립" | "약세", "outlook": "1문장" }
  ],
  "recommendedAllocation": [
    { "sector": "섹터명", "weight": "비중 %", "reason": "1문장" }
  ],
  "contrarian": { "sector": "섹터명", "reason": "역발상 기회 1문장" },
  "summary": "섹터 로테이션 분석 요약 2~3문장"
}

분석 기준:
- 1주/1개월/3개월 모멘텀 비교로 추세 전환 감지
- 방어주↔경기민감주 이동으로 경기 국면 판단
- 역발상: 급락 후 반등 가능 섹터 1개 제안
- 반드시 유효한 JSON만`

export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "잘못된 요청" }, { status: 400 })
    }

    const sectorText = parsed.data.sectors.map((s) =>
      `${s.name}: 1주=${s.changePercent1w.toFixed(1)}%, 1개월=${s.changePercent1m.toFixed(1)}%${s.changePercent3m != null ? `, 3개월=${s.changePercent3m.toFixed(1)}%` : ""}${s.avgPer != null ? `, 평균PER=${s.avgPer}` : ""}${s.topStocks?.length ? `, 주요종목=[${s.topStocks.join(",")}]` : ""}`
    ).join("\n")

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `섹터 로테이션을 분석해주세요:\n\n${sectorText}` },
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
