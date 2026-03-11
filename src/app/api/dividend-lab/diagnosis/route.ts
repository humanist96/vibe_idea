import OpenAI from "openai"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "../../../../../auth"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const diagnosisResponseSchema = z.object({
  overallGrade: z.enum(["A+", "A", "B+", "B", "C", "D", "F"]),
  summary: z.string(),
  strengths: z.array(z.string()),
  risks: z.array(z.string()),
  rebalancingSuggestions: z.array(z.object({
    action: z.enum(["add", "remove", "increase", "decrease"]),
    ticker: z.string(),
    market: z.enum(["KR", "US"]),
    reason: z.string(),
    suggestedWeight: z.number().optional(),
  })),
  gapMonthSuggestions: z.array(z.object({
    ticker: z.string(),
    name: z.string(),
    market: z.enum(["KR", "US"]),
    reason: z.string(),
  })),
})

const schema = z.object({
  items: z
    .array(
      z.object({
        ticker: z.string(),
        market: z.enum(["KR", "US"]),
        name: z.string(),
        weight: z.number(),
        dividendYield: z.number(),
        payoutRatio: z.number().nullable().optional(),
        consecutiveYears: z.number().optional(),
        sector: z.string().optional(),
        paymentMonths: z.array(z.number()).optional(),
      })
    )
    .min(1)
    .max(20),
  settings: z.object({
    totalAmount: z.number(),
    period: z.number(),
    drip: z.boolean(),
  }),
})

const SYSTEM_PROMPT = `당신은 배당 포트폴리오 진단 전문가입니다. 주어진 포트폴리오를 분석하고 개선 방안을 제시하세요.

반환 형식 (JSON만):
{
  "overallGrade": "A+" | "A" | "B+" | "B" | "C" | "D" | "F",
  "summary": "포트폴리오 전체 평가 요약 2~3문장",
  "strengths": ["강점1", "강점2"],
  "risks": ["리스크1", "리스크2"],
  "rebalancingSuggestions": [
    {
      "action": "add" | "remove" | "increase" | "decrease",
      "ticker": "종목코드",
      "market": "KR" | "US",
      "reason": "이유",
      "suggestedWeight": 숫자 (optional)
    }
  ],
  "gapMonthSuggestions": [
    {
      "ticker": "종목코드",
      "name": "종목명",
      "market": "KR" | "US",
      "reason": "이 종목이 공백월 해소에 도움되는 이유"
    }
  ]
}

분석 기준:
- 가중 평균 배당률과 안정성 평가
- 섹터 집중도 (40% 초과 시 분산 필요)
- 배당 공백월 분석 (매월 배당 수령이 이상적)
- 배당성향 80% 초과 종목은 삭감 리스크
- 국내/해외 분산 정도
- DRIP 효과 분석
- 반드시 유효한 JSON만 출력`

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "로그인이 필요합니다." },
        { status: 401 }
      )
    }

    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "잘못된 요청" },
        { status: 400 }
      )
    }

    const { items, settings } = parsed.data

    const stockLines = items
      .map((s) => {
        const parts = [
          `${s.name}(${s.ticker}, ${s.market})`,
          `비중: ${s.weight.toFixed(1)}%`,
          `배당률: ${s.dividendYield}%`,
          s.payoutRatio != null ? `배당성향: ${s.payoutRatio}%` : null,
          s.consecutiveYears ? `연속증가: ${s.consecutiveYears}년` : null,
          s.sector ? `섹터: ${s.sector}` : null,
          s.paymentMonths?.length
            ? `배당월: ${s.paymentMonths.join(",")}월`
            : null,
        ]
          .filter(Boolean)
          .join(", ")
        return `- ${parts}`
      })
      .join("\n")

    const settingsText = [
      `총 투자금: ${settings.totalAmount.toLocaleString()}만원`,
      `투자 기간: ${settings.period}년`,
      `배당 재투자(DRIP): ${settings.drip ? "ON" : "OFF"}`,
    ].join("\n")

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `배당 포트폴리오를 진단해주세요.\n\n투자 설정:\n${settingsText}\n\n포트폴리오 구성:\n${stockLines}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1200,
    })

    const content = completion.choices[0]?.message?.content?.trim()
    if (!content) {
      return NextResponse.json(
        { success: false, error: "AI 응답 없음" },
        { status: 500 }
      )
    }

    const cleaned = content
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim()

    let rawParsed: unknown
    try {
      rawParsed = JSON.parse(cleaned)
    } catch {
      return NextResponse.json(
        { success: false, error: "AI 응답을 파싱할 수 없습니다." },
        { status: 502 }
      )
    }

    const validated = diagnosisResponseSchema.safeParse(rawParsed)
    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: "AI 응답 형식이 올바르지 않습니다." },
        { status: 502 }
      )
    }

    return NextResponse.json({ success: true, data: validated.data })
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류"
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
