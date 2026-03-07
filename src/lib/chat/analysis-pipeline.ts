/**
 * 분석 파이프라인 — AI에 넘기기 전 사전 분석을 수행한다.
 *
 * 순수 계산 함수들 (API 호출 없음, 빠름).
 * 원시 데이터를 해석 가능한 인사이트로 변환한다.
 */

import type { EnhancedStockData, USStockChatData } from "./data-fetcher"

// ── 52주 포지션 ──────────────────────────────────────────────

/** 52주 범위 내 현재 가격 위치 (0-100%) */
export function compute52WeekPosition(
  price: number,
  high: number,
  low: number
): number {
  if (high === low || high === 0) return 50
  return Math.round(((price - low) / (high - low)) * 100)
}

// ── 추세 방향 ────────────────────────────────────────────────

export type TrendDirection = "↑ 개선" | "→ 유지" | "↓ 악화"

/** 값 배열의 추세 방향 판단 (최근값 vs 이전 평균) */
export function computeTrendDirection(values: readonly number[]): TrendDirection {
  if (values.length < 2) return "→ 유지"

  const latest = values[0]
  const prev = values.slice(1)
  const prevAvg = prev.reduce((s, v) => s + v, 0) / prev.length

  const changePct = prevAvg !== 0 ? ((latest - prevAvg) / Math.abs(prevAvg)) * 100 : 0

  if (changePct > 3) return "↑ 개선"
  if (changePct < -3) return "↓ 악화"
  return "→ 유지"
}

// ── Bull/Bear 팩터 자동 생성 ─────────────────────────────────

interface BullBearFactors {
  readonly bull: readonly string[]
  readonly bear: readonly string[]
}

/** KR 종목 데이터에서 Bull/Bear 팩터를 자동 생성 */
export function generateBullBearFactors(data: EnhancedStockData): BullBearFactors {
  const bull: string[] = []
  const bear: string[] = []

  // RSI 기반
  if (data.technicals) {
    if (data.technicals.rsi < 40) bull.push(`RSI 과매도 구간 (${data.technicals.rsi.toFixed(1)})`)
    if (data.technicals.rsi > 70) bear.push(`RSI 과매수 구간 (${data.technicals.rsi.toFixed(1)})`)

    // MACD 기반
    if (data.technicals.macdHistogram > 0) bull.push("MACD 골든크로스 신호")
    if (data.technicals.macdHistogram < 0) bear.push("MACD 데드크로스 신호")

    // 이동평균 대비
    if (data.technicals.priceVsSma200 > 0) bull.push(`200일 이동평균 위 (${data.technicals.priceVsSma200.toFixed(1)}%)`)
    if (data.technicals.priceVsSma200 < -10) bear.push(`200일 이동평균 크게 하회 (${data.technicals.priceVsSma200.toFixed(1)}%)`)
  }

  // 외국인 수급
  if (data.investorFlow && data.investorFlow.entries.length >= 3) {
    const recent = data.investorFlow.entries.slice(0, 5)
    const foreignSum = recent.reduce((s, e) => s + e.foreignNet, 0)
    if (foreignSum > 0) bull.push("외국인 최근 순매수 우세")
    if (foreignSum < 0) bear.push("외국인 최근 순매도 우세")
  }

  // 실적 서프라이즈
  if (data.earningsSurprise && data.earningsSurprise.surprises.length > 0) {
    const latest = data.earningsSurprise.surprises[0]
    if (latest.verdict === "beat") bull.push(`최근 실적 서프라이즈 (${latest.metric} +${latest.surprisePercent.toFixed(1)}%)`)
    if (latest.verdict === "miss") bear.push(`최근 실적 미스 (${latest.metric} ${latest.surprisePercent.toFixed(1)}%)`)
  }

  // AI 점수
  if (data.aiScore) {
    if (data.aiScore.aiScore >= 7) bull.push(`AI 점수 높음 (${data.aiScore.aiScore}/10)`)
    if (data.aiScore.aiScore <= 4) bear.push(`AI 점수 낮음 (${data.aiScore.aiScore}/10)`)
  }

  // 목표가 괴리
  if (data.consensus && data.quote && data.consensus.consensus.targetPrice) {
    const gap = ((data.consensus.consensus.targetPrice - data.quote.price) / data.quote.price) * 100
    if (gap > 15) bull.push(`목표가 상향 여력 (+${gap.toFixed(1)}%)`)
    if (gap < -10) bear.push(`목표가 하향 괴리 (${gap.toFixed(1)}%)`)
  }

  // 52주 포지션
  if (data.quote && data.quote.fiftyTwoWeekHigh > 0 && data.quote.fiftyTwoWeekLow > 0) {
    const position = compute52WeekPosition(
      data.quote.price,
      data.quote.fiftyTwoWeekHigh,
      data.quote.fiftyTwoWeekLow
    )
    if (position > 90) bear.push(`52주 고점 근접 (상위 ${position}%)`)
    if (position < 20) bull.push(`52주 저점 근접 (하위 ${position}%)`)
  }

  // 공매도
  if (data.shortSelling && data.shortSelling.entries.length > 0) {
    const latestRatio = data.shortSelling.entries[0].shortRatio
    if (latestRatio > 5) bear.push(`공매도 비율 높음 (${latestRatio.toFixed(1)}%)`)
  }

  // 프로그램 매매
  if (data.programTrading && data.programTrading.entries.length >= 3) {
    const netSum = data.programTrading.entries.slice(0, 5).reduce((s, e) => s + e.programNet, 0)
    if (netSum > 0) bull.push("프로그램 순매수 유입")
    if (netSum < 0) bear.push("프로그램 순매도 유출")
  }

  return { bull: bull.slice(0, 5), bear: bear.slice(0, 5) }
}

/** US 종목 데이터에서 Bull/Bear 팩터를 자동 생성 */
export function generateUSBullBearFactors(data: USStockChatData): BullBearFactors {
  const bull: string[] = []
  const bear: string[] = []

  // RSI 기반
  if (data.technicals) {
    if (data.technicals.rsi < 40) bull.push(`RSI 과매도 구간 (${data.technicals.rsi.toFixed(1)})`)
    if (data.technicals.rsi > 70) bear.push(`RSI 과매수 구간 (${data.technicals.rsi.toFixed(1)})`)

    if (data.technicals.macdHistogram > 0) bull.push("MACD 골든크로스 신호")
    if (data.technicals.macdHistogram < 0) bear.push("MACD 데드크로스 신호")

    if (data.technicals.priceVsSma200 > 0) bull.push(`200일 이동평균 위 (${data.technicals.priceVsSma200.toFixed(1)}%)`)
    if (data.technicals.priceVsSma200 < -10) bear.push(`200일 이동평균 크게 하회 (${data.technicals.priceVsSma200.toFixed(1)}%)`)
  }

  // 실적
  if (data.earnings.length > 0) {
    const latest = data.earnings[0]
    if (latest.surprisePercent != null) {
      if (latest.surprisePercent > 0) bull.push(`최근 실적 Beat (+${latest.surprisePercent.toFixed(1)}%)`)
      if (latest.surprisePercent < 0) bear.push(`최근 실적 Miss (${latest.surprisePercent.toFixed(1)}%)`)
    }
  }

  // 밸류에이션
  if (data.statistics) {
    if (data.statistics.pegRatio != null && data.statistics.pegRatio < 1) bull.push(`PEG < 1 (${data.statistics.pegRatio.toFixed(2)}) — 성장 대비 저평가`)
    if (data.statistics.pegRatio != null && data.statistics.pegRatio > 3) bear.push(`PEG > 3 (${data.statistics.pegRatio.toFixed(2)}) — 성장 대비 고평가`)

    if (data.statistics.revenueGrowthYoY != null && data.statistics.revenueGrowthYoY > 0.15) bull.push(`매출 성장률 높음 (YoY +${(data.statistics.revenueGrowthYoY * 100).toFixed(1)}%)`)
    if (data.statistics.revenueGrowthYoY != null && data.statistics.revenueGrowthYoY < -0.05) bear.push(`매출 역성장 (YoY ${(data.statistics.revenueGrowthYoY * 100).toFixed(1)}%)`)

    if (data.statistics.shortRatio != null && data.statistics.shortRatio > 5) bear.push(`공매도 비율 높음 (Short Ratio: ${data.statistics.shortRatio.toFixed(1)})`)
  }

  // 내부자 거래
  if (data.insiderTransactions.length > 0) {
    const buys = data.insiderTransactions.filter((t) => t.transactionCode === "P").length
    const sells = data.insiderTransactions.filter((t) => t.transactionCode === "S").length
    if (buys > sells) bull.push("내부자 순매수 우세")
    if (sells > buys) bear.push("내부자 순매도 우세")
  }

  // 52주 포지션
  if (data.metrics.fiftyTwoWeekHigh && data.metrics.fiftyTwoWeekLow) {
    const position = compute52WeekPosition(
      data.quote.price,
      data.metrics.fiftyTwoWeekHigh,
      data.metrics.fiftyTwoWeekLow
    )
    if (position > 90) bear.push(`52주 고점 근접 (상위 ${position}%)`)
    if (position < 20) bull.push(`52주 저점 근접 (하위 ${position}%)`)
  }

  return { bull: bull.slice(0, 5), bear: bear.slice(0, 5) }
}

// ── 핵심 시그널 요약 ─────────────────────────────────────────

/** 기술적+수급+펀더멘탈 시그널을 한 줄로 요약 */
export function summarizeSignals(data: EnhancedStockData): string {
  const signals: string[] = []

  // 기술적 시그널
  if (data.technicals) {
    const rsiZone = data.technicals.rsi < 30 ? "과매도" : data.technicals.rsi > 70 ? "과매수" : "중립"
    const macdDir = data.technicals.macdHistogram > 0 ? "골든크로스" : "데드크로스"
    signals.push(`기술적: RSI ${rsiZone} + MACD ${macdDir}`)
  }

  // 수급 시그널
  if (data.investorFlow && data.investorFlow.entries.length > 0) {
    const recentForeign = data.investorFlow.entries.slice(0, 5).reduce((s, e) => s + e.foreignNet, 0)
    const direction = recentForeign > 0 ? "순매수" : "순매도"
    signals.push(`수급: 외국인 5일 ${direction}`)
  }

  // 밸류에이션 시그널
  if (data.quote) {
    const parts: string[] = []
    if (data.quote.per != null) parts.push(`PER ${data.quote.per.toFixed(1)}배`)
    if (parts.length > 0) signals.push(`밸류에이션: ${parts.join(", ")}`)
  }

  return signals.length > 0 ? `[사전 분석 요약] ${signals.join(" / ")}` : ""
}

/** US 종목 시그널 요약 */
export function summarizeUSSignals(data: USStockChatData): string {
  const signals: string[] = []

  if (data.technicals) {
    const rsiZone = data.technicals.rsi < 30 ? "과매도" : data.technicals.rsi > 70 ? "과매수" : "중립"
    const macdDir = data.technicals.macdHistogram > 0 ? "골든크로스" : "데드크로스"
    signals.push(`기술적: RSI ${rsiZone} + MACD ${macdDir}`)
  }

  if (data.statistics) {
    const parts: string[] = []
    if (data.statistics.forwardPE != null) parts.push(`Forward PE ${data.statistics.forwardPE.toFixed(1)}x`)
    if (data.statistics.pegRatio != null) parts.push(`PEG ${data.statistics.pegRatio.toFixed(2)}`)
    if (parts.length > 0) signals.push(`밸류에이션: ${parts.join(", ")}`)
  }

  if (data.earnings.length > 0 && data.earnings[0].surprisePercent != null) {
    const latest = data.earnings[0]
    const verdict = latest.surprisePercent! > 0 ? "Beat" : "Miss"
    signals.push(`실적: 최근 ${verdict} (${latest.surprisePercent! > 0 ? "+" : ""}${latest.surprisePercent!.toFixed(1)}%)`)
  }

  return signals.length > 0 ? `[사전 분석 요약] ${signals.join(" / ")}` : ""
}

// ── 파이프라인 실행 ──────────────────────────────────────────

/** KR 종목 사전 분석 실행 */
export function runAnalysisPipeline(data: EnhancedStockData): string {
  const parts: string[] = []

  // 시그널 요약
  const signalSummary = summarizeSignals(data)
  if (signalSummary) parts.push(signalSummary)

  // 52주 포지션
  if (data.quote && data.quote.fiftyTwoWeekHigh > 0 && data.quote.fiftyTwoWeekLow > 0) {
    const position = compute52WeekPosition(
      data.quote.price,
      data.quote.fiftyTwoWeekHigh,
      data.quote.fiftyTwoWeekLow
    )
    parts.push(`[52주 포지션] 현재 가격은 52주 범위의 ${position}% 위치`)
  }

  // Bull/Bear 팩터
  const { bull, bear } = generateBullBearFactors(data)
  if (bull.length > 0 || bear.length > 0) {
    const lines: string[] = ["[Bull/Bear 사전 분석]"]
    if (bull.length > 0) {
      lines.push("Bull 팩터:")
      for (const b of bull) lines.push(`  + ${b}`)
    }
    if (bear.length > 0) {
      lines.push("Bear 팩터:")
      for (const b of bear) lines.push(`  - ${b}`)
    }
    parts.push(lines.join("\n"))
  }

  return parts.join("\n\n")
}

/** US 종목 사전 분석 실행 */
export function runUSAnalysisPipeline(data: USStockChatData): string {
  const parts: string[] = []

  // 시그널 요약
  const signalSummary = summarizeUSSignals(data)
  if (signalSummary) parts.push(signalSummary)

  // 52주 포지션
  if (data.metrics.fiftyTwoWeekHigh && data.metrics.fiftyTwoWeekLow) {
    const position = compute52WeekPosition(
      data.quote.price,
      data.metrics.fiftyTwoWeekHigh,
      data.metrics.fiftyTwoWeekLow
    )
    parts.push(`[52주 포지션] 현재 가격은 52주 범위의 ${position}% 위치`)
  }

  // Bull/Bear 팩터
  const { bull, bear } = generateUSBullBearFactors(data)
  if (bull.length > 0 || bear.length > 0) {
    const lines: string[] = ["[Bull/Bear 사전 분석]"]
    if (bull.length > 0) {
      lines.push("Bull 팩터:")
      for (const b of bull) lines.push(`  + ${b}`)
    }
    if (bear.length > 0) {
      lines.push("Bear 팩터:")
      for (const b of bear) lines.push(`  - ${b}`)
    }
    parts.push(lines.join("\n"))
  }

  return parts.join("\n\n")
}
