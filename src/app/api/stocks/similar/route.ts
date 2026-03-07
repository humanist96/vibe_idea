import OpenAI from "openai"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const schema = z.object({
  ticker: z.string(),
  name: z.string(),
  market: z.enum(["KR", "US"]),
  sector: z.string().optional(),
  per: z.number().nullable().optional(),
  pbr: z.number().nullable().optional(),
  marketCap: z.number().optional(),
  dividendYield: z.number().nullable().optional(),
  changePercent: z.number().optional(),
})

const SYSTEM_PROMPT = `당신은 종목 DNA 매칭 전문가입니다. 주어진 종목과 유사한 종목 5개를 추천하세요.

유사도 기준:
1. 같은/유사 섹터
2. 유사한 시가총액 규모
3. 유사한 밸류에이션(PER, PBR)
4. 유사한 사업 모델이나 수익 구조
5. 한국(KOSPI/KOSDAQ)과 미국(NYSE/NASDAQ) 모두 포함

반환 형식 (JSON만):
{
  "dnaProfile": {
    "growth": "고성장" | "안정성장" | "저성장",
    "value": "가치주" | "성장주" | "배당주" | "턴어라운드",
    "size": "대형" | "중형" | "소형",
    "style": "핵심 투자 성격 한 단어"
  },
  "similarStocks": [
    {
      "ticker": "종목코드",
      "name": "종목명",
      "market": "KR" | "US",
      "similarity": 1~100,
      "reason": "유사 이유 1문장",
      "sector": "섹터"
    }
  ],
  "crossMarketPeer": {
    "ticker": "가장 유사한 해외/국내 종목코드",
    "name": "종목명",
    "market": "KR" | "US",
    "reason": "글로벌 피어 선정 이유 1문장"
  },
  "summary": "DNA 분석 요약 2문장"
}

한국 종목은 6자리 숫자 코드(예: 005930), 미국 종목은 티커 심볼(예: AAPL).
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

    const stock = parsed.data
    const parts = [
      `종목: ${stock.name}(${stock.ticker})`,
      `시장: ${stock.market}`,
    ]
    if (stock.sector) parts.push(`섹터: ${stock.sector}`)
    if (stock.per != null) parts.push(`PER: ${stock.per}`)
    if (stock.pbr != null) parts.push(`PBR: ${stock.pbr}`)
    if (stock.marketCap) parts.push(`시가총액: ${stock.marketCap.toLocaleString()}`)
    if (stock.dividendYield != null) parts.push(`배당률: ${stock.dividendYield}%`)
    if (stock.changePercent) parts.push(`등락률: ${stock.changePercent.toFixed(1)}%`)

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `이 종목과 유사한 종목을 찾아주세요:\n\n${parts.join("\n")}` },
      ],
      temperature: 0.4,
      max_tokens: 700,
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
      { success: false, error: `유사 종목 분석 실패: ${message}` },
      { status: 500 }
    )
  }
}
