/**
 * 대화형 AI 어시스턴트 시스템 프롬프트
 */

export const SYSTEM_PROMPT = `당신은 한국 주식 시장 전문 AI 투자정보 어시스턴트 "InvestHub AI"입니다.

## 핵심 원칙
1. **정보 제공만** 합니다. 투자 자문, 매매 추천, 목표가 제시는 절대 하지 않습니다.
2. **한국어**로 응답합니다. 금융 용어는 한국어 표기를 우선합니다 (예: PER(주가수익비율)).
3. **데이터 기반** 응답만 합니다. 제공된 데이터 외의 수치를 만들어내지 않습니다.
4. **면책 문구**를 응답 마지막에 항상 포함합니다.

## 응답 스타일
- 마크다운 형식을 사용합니다 (제목, 표, 굵은 글씨, 목록 등).
- 숫자는 천 단위 쉼표를 사용합니다 (예: 72,400원).
- 등락률은 양수면 +, 음수면 -를 표시합니다.
- 시가총액은 억원 단위로 표시합니다.
- 간결하고 핵심적으로 답합니다. 불필요한 서론은 생략합니다.

## 금지 사항
- "사세요", "파세요", "매수/매도하세요" 등 직접적 매매 권유
- "~할 것으로 보입니다", "상승이 예상됩니다" 등 미래 예측 단정
- 제공되지 않은 데이터나 수치를 지어내는 것
- 다른 AI 서비스나 증권사 자문 서비스를 언급하는 것

## 면책 문구
모든 응답 마지막에 다음 문구를 포함하세요:
> ⚠️ 본 정보는 투자 참고용이며 투자 권유가 아닙니다.
` as const

export function buildStockAnalysisContext(data: {
  readonly name: string
  readonly ticker: string
  readonly price: number
  readonly change: number
  readonly changePercent: number
  readonly volume: number
  readonly marketCap: number
  readonly per: number | null
  readonly pbr: number | null
  readonly eps: number | null
  readonly dividendYield: number | null
  readonly fiftyTwoWeekHigh: number
  readonly fiftyTwoWeekLow: number
  readonly foreignRate: number | null
  readonly aiScore?: number | null
  readonly aiRating?: string | null
  readonly aiSummary?: string | null
  readonly aiFactors?: readonly { readonly name: string; readonly impact: string }[]
}): string {
  const lines = [
    `\n[종목 데이터: ${data.name}(${data.ticker})]`,
    `현재가: ${data.price.toLocaleString()}원 (${data.changePercent >= 0 ? "+" : ""}${data.changePercent.toFixed(2)}%)`,
    `거래량: ${data.volume.toLocaleString()}`,
    `시가총액: ${(data.marketCap / 100000000).toFixed(0)}억원`,
    `52주 최고/최저: ${data.fiftyTwoWeekHigh.toLocaleString()}원 / ${data.fiftyTwoWeekLow.toLocaleString()}원`,
  ]

  if (data.per !== null) lines.push(`PER: ${data.per.toFixed(2)}배`)
  if (data.pbr !== null) lines.push(`PBR: ${data.pbr.toFixed(2)}배`)
  if (data.eps !== null) lines.push(`EPS: ${data.eps.toLocaleString()}원`)
  if (data.dividendYield !== null)
    lines.push(`배당수익률: ${data.dividendYield.toFixed(2)}%`)
  if (data.foreignRate !== null)
    lines.push(`외국인 보유비율: ${data.foreignRate.toFixed(2)}%`)

  if (data.aiScore != null) {
    lines.push(`\n[AI 분석]`)
    lines.push(`종합 점수: ${data.aiScore}/10`)
    if (data.aiRating) lines.push(`의견: ${data.aiRating}`)
    if (data.aiSummary) lines.push(`요약: ${data.aiSummary}`)
    if (data.aiFactors && data.aiFactors.length > 0) {
      lines.push(`주요 요인:`)
      data.aiFactors.forEach((f) => {
        const icon =
          f.impact === "positive" ? "+" : f.impact === "negative" ? "-" : "•"
        lines.push(`  ${icon} ${f.name}`)
      })
    }
  }

  return lines.join("\n")
}

export function buildMarketOverviewContext(data: {
  readonly kospi: { readonly price: number; readonly changePercent: number } | null
  readonly kosdaq: { readonly price: number; readonly changePercent: number } | null
  readonly usdKrw: { readonly price: number; readonly changePercent: number } | null
}): string {
  const lines = ["\n[시장 현황]"]

  if (data.kospi) {
    lines.push(
      `코스피: ${data.kospi.price.toLocaleString()} (${data.kospi.changePercent >= 0 ? "+" : ""}${data.kospi.changePercent.toFixed(2)}%)`
    )
  }
  if (data.kosdaq) {
    lines.push(
      `코스닥: ${data.kosdaq.price.toLocaleString()} (${data.kosdaq.changePercent >= 0 ? "+" : ""}${data.kosdaq.changePercent.toFixed(2)}%)`
    )
  }
  if (data.usdKrw) {
    lines.push(
      `USD/KRW: ${data.usdKrw.price.toLocaleString()} (${data.usdKrw.changePercent >= 0 ? "+" : ""}${data.usdKrw.changePercent.toFixed(2)}%)`
    )
  }

  return lines.join("\n")
}

export function buildWatchlistContext(
  stocks: readonly {
    readonly name: string
    readonly ticker: string
    readonly price: number
    readonly changePercent: number
    readonly aiScore: number | null
  }[]
): string {
  if (stocks.length === 0) return "\n[관심종목 데이터 없음]"

  const lines = ["\n[관심종목 현황]"]
  stocks.forEach((s) => {
    const scoreStr = s.aiScore != null ? ` | AI점수: ${s.aiScore}` : ""
    lines.push(
      `• ${s.name}(${s.ticker}): ${s.price.toLocaleString()}원 (${s.changePercent >= 0 ? "+" : ""}${s.changePercent.toFixed(2)}%)${scoreStr}`
    )
  })

  return lines.join("\n")
}
