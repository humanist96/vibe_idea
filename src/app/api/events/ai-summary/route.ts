import OpenAI from "openai"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const schema = z.object({
  filings: z.array(z.object({
    title: z.string(),
    company: z.string(),
    ticker: z.string(),
    type: z.string(),
    date: z.string(),
    content: z.string().optional(),
  })).min(1).max(10),
})

const SYSTEM_PROMPT = `당신은 기업 공시/Filing 분석 전문가입니다. 공시 내용을 투자자 관점에서 핵심만 요약하세요.

반환 형식 (JSON만):
{
  "summaries": [
    {
      "ticker": "코드",
      "company": "회사명",
      "type": "공시 유형",
      "impact": "호재" | "악재" | "중립",
      "impactScore": 1~5,
      "headline": "핵심 내용 1문장",
      "keyPoints": ["핵심1", "핵심2"],
      "investorAction": "매수 검토" | "보유 유지" | "비중 축소" | "관망",
      "priceImpact": "상승 예상" | "하락 예상" | "제한적"
    }
  ],
  "topAlert": {
    "ticker": "가장 주목할 공시 종목코드",
    "reason": "1문장"
  },
  "summary": "전체 공시 동향 요약 1~2문장"
}

분석 기준:
- 실적 발표 > 대규모 계약 > 유상증자 > 배당 > 임원변동 순으로 중요도
- impactScore 5가 가장 큰 영향
- 투자자 액션은 보수적으로 제안
- 반드시 유효한 JSON만`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "잘못된 요청" }, { status: 400 })
    }

    const filingText = parsed.data.filings.map((f) =>
      `[${f.date}] ${f.company}(${f.ticker}) - ${f.type}: ${f.title}${f.content ? `\n내용: ${f.content.slice(0, 300)}` : ""}`
    ).join("\n\n")

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `다음 공시들을 분석해주세요:\n\n${filingText}` },
      ],
      temperature: 0.2,
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
