import OpenAI from "openai"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const schema = z.object({
  ticker: z.string(),
  name: z.string(),
  currentPrice: z.number(),
  high52w: z.number().optional(),
  low52w: z.number().optional(),
  per: z.number().nullable().optional(),
  pbr: z.number().nullable().optional(),
  rsi: z.number().nullable().optional(),
  volume: z.number().optional(),
  avgVolume: z.number().optional(),
  changePercent: z.number().optional(),
  avgPrice: z.number().optional(),
  holdingShares: z.number().optional(),
})

const SYSTEM_PROMPT = `당신은 매매 타이밍 코치입니다. 기술적/가치 지표를 종합하여 최적의 매수/매도 시점을 코칭하세요.

반환 형식 (JSON만):
{
  "signal": "강력 매수" | "매수" | "보유" | "비중축소" | "매도",
  "confidence": 1~100,
  "timing": {
    "entry": {
      "idealPrice": 숫자,
      "supportLevels": [숫자, 숫자],
      "strategy": "매수 전략 1~2문장"
    },
    "exit": {
      "targetPrice": 숫자,
      "resistanceLevels": [숫자, 숫자],
      "stopLoss": 숫자,
      "strategy": "매도 전략 1~2문장"
    }
  },
  "technicalView": {
    "trend": "상승" | "횡보" | "하락",
    "momentum": "강세" | "중립" | "약세",
    "volumeSignal": "긍정" | "중립" | "부정",
    "comment": "기술적 관점 1문장"
  },
  "positionSizing": {
    "recommendedWeight": "포트폴리오 비중 %",
    "splitStrategy": "분할매수/매도 전략 1문장"
  },
  "risks": ["리스크1", "리스크2"],
  "summary": "매매 타이밍 코칭 요약 2~3문장"
}

분석 기준:
- RSI 30이하 과매도 → 매수 기회, 70이상 과매수 → 주의
- 52주 신고가 근접 → 돌파 매수 or 차익 실현 판단
- 거래량 급증 + 양봉 → 긍정 시그널
- 보유 중이면 평균단가 대비 수익률 고려
- stopLoss는 현재가 대비 -5~10% 수준
- 반드시 유효한 JSON만`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "잘못된 요청" }, { status: 400 })
    }

    const s = parsed.data
    const parts = [
      `종목: ${s.name}(${s.ticker})`,
      `현재가: ${s.currentPrice.toLocaleString()}원`,
      s.high52w ? `52주 고가: ${s.high52w.toLocaleString()}` : null,
      s.low52w ? `52주 저가: ${s.low52w.toLocaleString()}` : null,
      s.per != null ? `PER: ${s.per}` : null,
      s.pbr != null ? `PBR: ${s.pbr}` : null,
      s.rsi != null ? `RSI: ${s.rsi.toFixed(0)}` : null,
      s.volume ? `거래량: ${s.volume.toLocaleString()}` : null,
      s.avgVolume ? `평균거래량: ${s.avgVolume.toLocaleString()}` : null,
      s.changePercent != null ? `등락률: ${s.changePercent > 0 ? "+" : ""}${s.changePercent.toFixed(1)}%` : null,
      s.avgPrice ? `보유 평균단가: ${s.avgPrice.toLocaleString()}원` : null,
      s.holdingShares ? `보유 수량: ${s.holdingShares}주` : null,
    ].filter(Boolean).join("\n")

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `매매 타이밍을 코칭해주세요.\n\n${parts}` },
      ],
      temperature: 0.2,
      max_tokens: 700,
      response_format: { type: "json_object" },
    })

    const content = completion.choices[0]?.message?.content?.trim()
    if (!content) {
      return NextResponse.json({ success: false, error: "AI 응답 없음" }, { status: 500 })
    }
    return NextResponse.json({ success: true, data: JSON.parse(content) })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "알 수 없는 오류"
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
