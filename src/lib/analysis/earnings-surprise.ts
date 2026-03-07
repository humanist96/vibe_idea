import type { FinanceData } from "@/lib/api/naver-finance-detail"

export interface EarningsSurprise {
  readonly quarter: string
  readonly metric: string
  readonly actual: number
  readonly consensus: number
  readonly surprisePercent: number
  readonly verdict: "beat" | "inline" | "miss"
}

export interface EarningsSurpriseResult {
  readonly ticker: string
  readonly surprises: readonly EarningsSurprise[]
  readonly latestVerdict: "beat" | "inline" | "miss" | null
  readonly latestSurprisePercent: number | null
}

function parseFinanceValue(raw: string | null): number | null {
  if (!raw) return null
  const cleaned = raw.replace(/,/g, "").trim()
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

/**
 * 분기 실적 데이터에서 실적 서프라이즈를 분석한다.
 *
 * 로직:
 * 1. isConsensus=false인 가장 최근 분기 → 실제 실적
 * 2. 동일 분기의 이전 컨센서스 추정치와 비교
 * 3. surprisePercent = ((actual - consensus) / |consensus|) × 100
 * 4. Beat(+5% 이상) / Inline(±5%) / Miss(-5% 이하)
 */
export function analyzeEarningsSurprise(
  quarterData: FinanceData | null,
  ticker: string
): EarningsSurpriseResult {
  if (!quarterData || quarterData.columns.length === 0) {
    return { ticker, surprises: [], latestVerdict: null, latestSurprisePercent: null }
  }

  const { columns, rows } = quarterData

  // Find the most recent actual column and a consensus column
  const actualCols = columns.filter((c) => !c.isConsensus)
  const consensusCols = columns.filter((c) => c.isConsensus)

  if (actualCols.length === 0 || consensusCols.length === 0) {
    return { ticker, surprises: [], latestVerdict: null, latestSurprisePercent: null }
  }

  const targetMetrics = ["매출액", "영업이익"]
  const surprises: EarningsSurprise[] = []

  // For the latest actual quarter, find the nearest consensus estimate
  const latestActual = actualCols[actualCols.length - 1]
  const latestActualIdx = columns.indexOf(latestActual)

  // Find a consensus column (could be for the same or next quarter)
  // We compare actual results against the consensus for the same quarter period
  let consensusCol = consensusCols.find((c) => c.key === latestActual.key)
  if (!consensusCol && consensusCols.length > 0) {
    consensusCol = consensusCols[0]
  }

  if (!consensusCol) {
    return { ticker, surprises: [], latestVerdict: null, latestSurprisePercent: null }
  }

  const consensusIdx = columns.indexOf(consensusCol)

  for (const metricName of targetMetrics) {
    const row = rows.find((r) => r.title.includes(metricName))
    if (!row) continue

    const actualVal = parseFinanceValue(row.values[latestActualIdx] ?? null)
    const consensusVal = parseFinanceValue(row.values[consensusIdx] ?? null)

    if (actualVal === null || consensusVal === null || consensusVal === 0) continue

    const surprisePercent = ((actualVal - consensusVal) / Math.abs(consensusVal)) * 100

    let verdict: "beat" | "inline" | "miss" = "inline"
    if (surprisePercent >= 5) verdict = "beat"
    else if (surprisePercent <= -5) verdict = "miss"

    surprises.push({
      quarter: latestActual.title,
      metric: metricName,
      actual: actualVal,
      consensus: consensusVal,
      surprisePercent,
      verdict,
    })
  }

  // Overall verdict based on 영업이익, fallback to 매출액
  const opSurprise = surprises.find((s) => s.metric.includes("영업이익"))
  const revSurprise = surprises.find((s) => s.metric.includes("매출액"))
  const primary = opSurprise ?? revSurprise ?? null

  return {
    ticker,
    surprises,
    latestVerdict: primary?.verdict ?? null,
    latestSurprisePercent: primary?.surprisePercent ?? null,
  }
}
