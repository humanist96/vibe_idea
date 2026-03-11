import OpenAI from "openai"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getGoogleNews } from "@/lib/api/google-news"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const schema = z.object({
  tickers: z.array(
    z.object({
      ticker: z.string(),
      name: z.string(),
    })
  ).min(1).max(10),
})

const SYSTEM_PROMPT = `당신은 뉴스 임팩트 분석 전문가입니다. 주어진 종목의 최신 뉴스 헤드라인을 분석하여 투자 영향도를 평가합니다.

반환 형식 (JSON만, 다른 텍스트 없이):
{
  "impacts": [
    {
      "ticker": "종목코드",
      "name": "종목명",
      "headline": "가장 영향력 있는 뉴스 헤드라인",
      "sentiment": "positive" | "negative" | "neutral",
      "impact": 1~5 (영향력 강도),
      "reason": "영향 사유 1문장",
      "category": "실적" | "산업" | "정책" | "수급" | "기술" | "기타"
    }
  ],
  "marketMood": "긍정적" | "부정적" | "중립",
  "summary": "전체 뉴스 동향 요약 1~2문장"
}

규칙:
- 뉴스가 없는 종목은 impacts에서 제외
- impact 점수: 1(무시할 수준), 2(약간), 3(보통), 4(중요), 5(매우 중요)
- 가장 최근 뉴스 위주로 분석
- 반드시 유효한 JSON만 응답`

export const maxDuration = 30

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

    const { tickers } = parsed.data

    const newsResults = await Promise.allSettled(
      tickers.map(async (t) => {
        const articles = await getGoogleNews(t.name)
        return {
          ticker: t.ticker,
          name: t.name,
          headlines: articles.slice(0, 5).map((a) => a.title),
        }
      })
    )

    const tickerNews = newsResults
      .filter((r): r is PromiseFulfilledResult<{ ticker: string; name: string; headlines: string[] }> =>
        r.status === "fulfilled" && r.value.headlines.length > 0
      )
      .map((r) => r.value)

    if (tickerNews.length === 0) {
      return NextResponse.json({
        success: true,
        data: { impacts: [], marketMood: "중립", summary: "관심종목 관련 최신 뉴스가 없습니다." },
      })
    }

    const newsText = tickerNews
      .map((t) => `[${t.name}(${t.ticker})]\n${t.headlines.map((h, i) => `${i + 1}. ${h}`).join("\n")}`)
      .join("\n\n")

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `다음 관심종목들의 최신 뉴스를 분석해주세요:\n\n${newsText}` },
      ],
      temperature: 0.2,
      max_tokens: 1200,
    })

    const content = completion.choices[0]?.message?.content?.trim()
    if (!content) {
      return NextResponse.json(
        { success: false, error: "AI 응답을 받지 못했습니다." },
        { status: 500 }
      )
    }

    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    try {
      return NextResponse.json({ success: true, data: JSON.parse(cleaned) })
    } catch {
      return NextResponse.json({ success: false, error: "AI 응답 파싱 실패" }, { status: 500 })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류"
    return NextResponse.json(
      { success: false, error: `뉴스 분석 실패: ${message}` },
      { status: 500 }
    )
  }
}
