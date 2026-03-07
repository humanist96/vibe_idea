import OpenAI from "openai"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const schema = z.object({
  portfolio: z.array(
    z.object({
      name: z.string(),
      ticker: z.string(),
      changePercent: z.number(),
      pnlPercent: z.number(),
    })
  ),
  marketIndices: z.object({
    kospi: z.object({ value: z.number(), change: z.number() }).optional(),
    kosdaq: z.object({ value: z.number(), change: z.number() }).optional(),
  }).optional(),
  date: z.string(),
})

const SYSTEM_PROMPT = `당신은 AI 투자 일기 작성 전문가입니다. 사용자의 포트폴리오 성과와 시장 데이터를 바탕으로 한 줄 일기를 작성하세요.

반환 형식 (JSON만):
{
  "title": "오늘의 투자 일기 제목 (임팩트 있게, 10자 이내)",
  "emoji": "일기 대표 이모지 1개",
  "marketSummary": "시장 요약 1문장",
  "portfolioSummary": "포트폴리오 성과 요약 1~2문장",
  "topMover": {
    "name": "가장 크게 움직인 종목명",
    "ticker": "코드",
    "changePercent": 등락률,
    "reason": "추정 사유 1문장"
  },
  "lesson": "오늘의 투자 교훈 1문장",
  "mood": "great" | "good" | "neutral" | "bad" | "terrible",
  "fullEntry": "3~4문장의 일기 본문 (자연스러운 문체로)"
}

규칙:
- 수익이 좋으면 긍정적이지만 과신 경계
- 손실이면 위로하되 객관적 분석 포함
- 투자 교훈은 실제 도움이 되는 내용
- 반드시 유효한 JSON만`

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

    const { portfolio, marketIndices, date } = parsed.data

    if (portfolio.length === 0) {
      return NextResponse.json(
        { success: false, error: "포트폴리오 데이터가 없습니다." },
        { status: 400 }
      )
    }

    const parts = [`날짜: ${date}`]

    if (marketIndices?.kospi) {
      parts.push(`KOSPI: ${marketIndices.kospi.value.toFixed(0)} (${marketIndices.kospi.change >= 0 ? "+" : ""}${marketIndices.kospi.change.toFixed(1)}%)`)
    }
    if (marketIndices?.kosdaq) {
      parts.push(`KOSDAQ: ${marketIndices.kosdaq.value.toFixed(0)} (${marketIndices.kosdaq.change >= 0 ? "+" : ""}${marketIndices.kosdaq.change.toFixed(1)}%)`)
    }

    parts.push("\n보유 종목 성과:")
    for (const item of portfolio) {
      parts.push(`- ${item.name}(${item.ticker}): 오늘 ${item.changePercent >= 0 ? "+" : ""}${item.changePercent.toFixed(1)}%, 누적 ${item.pnlPercent >= 0 ? "+" : ""}${item.pnlPercent.toFixed(1)}%`)
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `오늘의 투자 일기를 작성해주세요.\n\n${parts.join("\n")}` },
      ],
      temperature: 0.6,
      max_tokens: 500,
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
      { success: false, error: `일기 생성 실패: ${message}` },
      { status: 500 }
    )
  }
}
