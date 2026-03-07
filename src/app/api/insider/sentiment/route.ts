import OpenAI from "openai"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const schema = z.object({
  transactions: z.array(z.object({
    name: z.string(),
    position: z.string(),
    type: z.string(),
    shares: z.number(),
    price: z.number().optional(),
    date: z.string(),
    ticker: z.string(),
    companyName: z.string(),
  })).min(1),
})

const SYSTEM_PROMPT = `당신은 내부자 거래 패턴 분석 전문가입니다. 내부자 거래 목록을 분석하여 심리 지표를 생성하세요.

반환 형식 (JSON만):
{
  "overallSentiment": "강한 매수" | "매수" | "중립" | "매도" | "강한 매도",
  "sentimentScore": -100~100 (양수=매수심리, 음수=매도심리),
  "clusterBuys": [
    { "company": "회사명", "ticker": "코드", "buyerCount": 숫자, "signal": "설명 1문장" }
  ],
  "notableTransactions": [
    { "person": "이름", "position": "직급", "type": "매수|매도", "company": "회사명", "ticker": "코드", "significance": "높음|보통|낮음", "reason": "주목 이유 1문장" }
  ],
  "topBuyStocks": [
    { "ticker": "코드", "company": "회사명", "netBuyers": 숫자, "signal": "1문장" }
  ],
  "summary": "내부자 거래 심리 요약 2~3문장"
}

분석 기준:
- CEO/CFO 거래는 일반 임원보다 2배 가중
- 클러스터 매수(3명 이상 동시 매수)는 강한 확신 신호
- 대량 매도는 경고 신호
- 반드시 유효한 JSON만`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "잘못된 요청" }, { status: 400 })
    }

    const txText = parsed.data.transactions.map((t) =>
      `${t.date} | ${t.companyName}(${t.ticker}) | ${t.name}(${t.position}) | ${t.type} | ${t.shares.toLocaleString()}주${t.price ? ` @ ${t.price.toLocaleString()}원` : ""}`
    ).join("\n")

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `최근 내부자 거래를 분석해주세요:\n\n${txText}` },
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
