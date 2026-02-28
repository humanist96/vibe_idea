export interface FundamentalMetrics {
  readonly per: number | null
  readonly pbr: number | null
  readonly eps: number | null
  readonly dividendYield: number | null
  readonly marketCap: number
  readonly priceChange52w: number
}

export function getFundamentalScore(metrics: FundamentalMetrics): number {
  let score = 5

  // PER valuation
  if (metrics.per !== null && metrics.per > 0) {
    if (metrics.per < 8) score += 1.5
    else if (metrics.per < 12) score += 1
    else if (metrics.per < 20) score += 0
    else if (metrics.per < 30) score -= 0.5
    else score -= 1.5
  }

  // PBR valuation
  if (metrics.pbr !== null && metrics.pbr > 0) {
    if (metrics.pbr < 0.7) score += 1.5
    else if (metrics.pbr < 1) score += 1
    else if (metrics.pbr < 1.5) score += 0.3
    else if (metrics.pbr < 3) score -= 0.3
    else score -= 1
  }

  // Dividend yield
  if (metrics.dividendYield !== null && metrics.dividendYield > 0) {
    if (metrics.dividendYield > 5) score += 1
    else if (metrics.dividendYield > 3) score += 0.5
    else if (metrics.dividendYield > 1) score += 0.2
  }

  // 52-week price performance
  if (metrics.priceChange52w > 30) score += 0.5
  else if (metrics.priceChange52w > 10) score += 0.3
  else if (metrics.priceChange52w < -30) score -= 0.5
  else if (metrics.priceChange52w < -10) score -= 0.3

  return Math.max(1, Math.min(10, Math.round(score * 10) / 10))
}
