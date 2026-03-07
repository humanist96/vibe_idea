import OpenAI from "openai"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const stockSchema = z.object({
  ticker: z.string(),
  name: z.string(),
  price: z.number(),
  per: z.number().nullable().optional(),
  pbr: z.number().nullable().optional(),
  dividendYield: z.number().nullable().optional(),
  marketCap: z.number().optional(),
  changePercent: z.number().optional(),
  sector: z.string().optional(),
})

const schema = z.object({
  stocks: z.array(stockSchema).min(2).max(4),
})

const SYSTEM_PROMPT = `당신은 종목 비교 분석 전문가입니다. 주어진 종목들을 비교하고 승자를 선정하세요.

반환 형식 (JSON만):
{
  "winner": {
    "ticker": "코드",
    "name": "종목명",
    "reason": "승자 선정 이유 1~2문장"
  },
  "categories": [
    { "name": "성장성", "winner": "종목명", "ticker": "코드", "comment": "1문장" },
    { "name": "밸류에이션", "winner": "종목명", "ticker": "코드", "comment": "1문장" },
    { "name": "안정성", "winner": "종목명", "ticker": "코드", "comment": "1문장" },
    { "name": "배당매력", "winner": "종목명", "ticker": "코드", "comment": "1문장" }
  ],
  "correlation": "높음" | "보통" | "낮음",
  "diversificationBenefit": "분산 효과 설명 1문장",
  "investorType": {
    "growth": { "pick": "종목명", "ticker": "코드" },
    "value": { "pick": "종목명", "ticker": "코드" },
    "income": { "pick": "종목명", "ticker": "코드" }
  },
  "summary": "비교 분석 요약 2~3문장"
}

반드시 유효한 JSON만 응답.`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "잘못된 요청" }, { status: 400 })
    }

    const stockText = parsed.data.stocks.map((s) =>
      `${s.name}(${s.ticker}): 가격=${s.price.toLocaleString()}, ${s.per != null ? `PER=${s.per}` : "PER=N/A"}, ${s.pbr != null ? `PBR=${s.pbr}` : "PBR=N/A"}, ${s.dividendYield != null ? `배당=${s.dividendYield}%` : "배당=N/A"}, ${s.sector ?? "섹터 미분류"}${s.marketCap ? `, 시총=${s.marketCap.toLocaleString()}` : ""}`
    ).join("\n")

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `다음 종목들을 비교 분석해주세요:\n\n${stockText}` },
      ],
      temperature: 0.3,
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
