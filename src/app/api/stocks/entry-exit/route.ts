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

function buildSystemPrompt(currentPrice: number): string {
  const stop = Math.round(currentPrice * 0.93)
  const target = Math.round(currentPrice * 1.1)
  const support1 = Math.round(currentPrice * 0.95)
  const support2 = Math.round(currentPrice * 0.9)
  const resist1 = Math.round(currentPrice * 1.05)
  const resist2 = Math.round(currentPrice * 1.1)
  const ideal = Math.round(currentPrice * 0.97)

  return `당신은 매매 타이밍 코치입니다. 기술적/가치 지표를 종합하여 최적의 매수/매도 시점을 코칭하세요.

## 중요: 가격 규칙
- 모든 가격은 현재가(${currentPrice}원)와 동일한 단위의 원(KRW) 절대값이어야 합니다.
- 절대로 축약하지 마세요. 현재가가 160,600이면 손절가는 152,570처럼 현재가 근처여야 합니다.

아래 JSON 예시를 참고하되, 실제 분석 결과에 맞게 값을 바꾸세요:
{"signal":"보유","confidence":65,"timing":{"entry":{"idealPrice":${ideal},"supportLevels":[${support1},${support2}],"strategy":"분할 매수 전략"},"exit":{"targetPrice":${target},"resistanceLevels":[${resist1},${resist2}],"stopLoss":${stop},"strategy":"목표가 도달 시 분할 매도"}},"technicalView":{"trend":"횡보","momentum":"중립","volumeSignal":"중립","comment":"기술적 관점"},"positionSizing":{"recommendedWeight":"10%","splitStrategy":"3회 분할매수"},"risks":["리스크1","리스크2"],"summary":"코칭 요약 2~3문장"}

signal: "강력 매수", "매수", "보유", "비중축소", "매도" 중 하나
trend: "상승", "횡보", "하락" 중 하나
momentum: "강세", "중립", "약세" 중 하나
volumeSignal: "긍정", "중립", "부정" 중 하나

분석 기준:
- RSI 30이하 과매도 → 매수 기회, 70이상 과매수 → 주의
- 52주 신고가 근접 → 돌파 매수 or 차익 실현 판단
- 거래량 급증 + 양봉 → 긍정 시그널
- 보유 중이면 평균단가 대비 수익률 고려
- stopLoss는 현재가 대비 -5~10% 수준`
}

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
        { role: "system", content: buildSystemPrompt(s.currentPrice) },
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

    let data: Record<string, unknown>
    try {
      data = JSON.parse(content)
    } catch {
      // response_format이 실패한 경우 sanitize 시도
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return NextResponse.json({ success: false, error: "AI 응답 파싱 실패" }, { status: 500 })
      }
      const sanitized = jsonMatch[0]
        .replace(/,\s*([}\]])/g, "$1")
        .replace(/'/g, '"')
        .replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":')
      data = JSON.parse(sanitized)
    }

    // 가격 sanity check: AI가 비정상적으로 작은 값을 반환하면 현재가 기반으로 보정
    const price = s.currentPrice
    const minReasonable = price * 0.3
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const timing = data.timing as any
    if (timing) {
      if (timing.entry) {
        if (timing.entry.idealPrice < minReasonable) {
          timing.entry.idealPrice = Math.round(price * 0.95)
        }
        timing.entry.supportLevels = (timing.entry.supportLevels ?? []).map(
          (v: number) => v < minReasonable ? Math.round(price * 0.9) : v
        )
      }
      if (timing.exit) {
        if (timing.exit.targetPrice < minReasonable) {
          timing.exit.targetPrice = Math.round(price * 1.1)
        }
        if (timing.exit.stopLoss < minReasonable) {
          timing.exit.stopLoss = Math.round(price * 0.93)
        }
        timing.exit.resistanceLevels = (timing.exit.resistanceLevels ?? []).map(
          (v: number) => v < minReasonable ? Math.round(price * 1.05) : v
        )
      }
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "알 수 없는 오류"
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
