import OpenAI from "openai"
import { NextRequest, NextResponse } from "next/server"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const SYSTEM_PROMPT = `당신은 한국 주식 스크리너 필터 변환 전문가입니다.
사용자의 자연어 요청을 아래 JSON 필터 형식으로 변환하세요.

반환 형식 (JSON만 반환, 다른 텍스트 없이):
{
  "filters": {
    "market": "ALL" | "KOSPI" | "KOSDAQ",
    "sector": "섹터명" | "",
    "minPrice": "숫자" | "",
    "maxPrice": "숫자" | "",
    "minPer": "숫자" | "",
    "maxPer": "숫자" | "",
    "minPbr": "숫자" | "",
    "maxPbr": "숫자" | "",
    "minDividendYield": "숫자" | "",
    "maxDividendYield": "숫자" | "",
    "minChangePercent": "숫자" | "",
    "maxChangePercent": "숫자" | "",
    "minMarketCap": "숫자(억원 단위)" | "",
    "maxMarketCap": "숫자(억원 단위)" | "",
    "minForeignRate": "숫자" | ""
  },
  "sort": "marketCap" | "changePercent" | "volume" | "per" | "pbr" | "dividendYield",
  "order": "asc" | "desc",
  "description": "적용된 필터를 한국어로 간단히 설명"
}

규칙:
- 해당 없는 필터는 빈 문자열("") 로 두세요
- "저PER" = maxPer: "10", "고배당" = minDividendYield: "3"
- "대형주" = minMarketCap: "50000" (5조원 이상), "중형주" = minMarketCap: "5000" maxMarketCap: "50000"
- "소형주" = maxMarketCap: "5000" (5000억 이하)
- 시가총액은 억원 단위입니다
- "외국인 많이 보유" = minForeignRate: "20"
- "급등주" = minChangePercent: "5", "급락주" = maxChangePercent: "-5"
- "저평가" = maxPbr: "1" 또는 maxPer: "10"

사용 가능한 섹터 목록:
전기전자, 의약품, 서비스업, 화학, 유통업, 기계, 운수장비, 철강금속, 음식료품,
건설업, 섬유의복, 통신업, 비금속광물, 전기가스업, 의료정밀, 종이목재, 기타제조업,
은행, 증권, 보험, 금융업, 운수창고업

반드시 유효한 JSON만 응답하세요. 마크다운이나 설명을 추가하지 마세요.`

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json()

    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "검색어를 입력해주세요." },
        { status: 400 }
      )
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: query.trim() },
      ],
      temperature: 0,
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
    const parsed = JSON.parse(cleaned)

    return NextResponse.json({
      success: true,
      data: {
        filters: parsed.filters,
        sort: parsed.sort ?? "marketCap",
        order: parsed.order ?? "desc",
        description: parsed.description ?? "",
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류"
    return NextResponse.json(
      { success: false, error: `필터 변환 실패: ${message}` },
      { status: 500 }
    )
  }
}
