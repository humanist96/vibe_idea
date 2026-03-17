/**
 * 종목 비교 인텐트 — 타입 + 비교 메트릭 계산 + 컨텍스트 빌더
 *
 * 두 종목의 주요 지표를 비교하고 Winner를 판정한다.
 */

import type { EnhancedStockData } from "../data-fetcher"

// ── Types ──────────────────────────────────────────────────────

export interface ComparisonMetrics {
  readonly ticker: string
  readonly name: string
  readonly price: number
  readonly changePercent: number
  readonly per: number | null
  readonly pbr: number | null
  readonly eps: number | null
  readonly roe: number | null
  readonly dividendYield: number | null
  readonly marketCap: number | null
  readonly aiScore: number | null
  readonly targetPrice: number | null
  readonly investmentOpinion: string | null
  readonly rsi: number | null
  readonly maSignal: "golden" | "dead" | "neutral" | null
  readonly debtRatio: number | null
  readonly revenueGrowth: number | null
}

export interface StockComparisonContext {
  readonly stockA: ComparisonMetrics
  readonly stockB: ComparisonMetrics
  readonly winners: Readonly<
    Record<
      keyof Omit<ComparisonMetrics, "ticker" | "name">,
      "A" | "B" | "tie"
    >
  >
}

// ── Metric Extraction ──────────────────────────────────────────

/** EnhancedStockData에서 비교용 메트릭을 추출한다 */
export function extractComparisonMetrics(
  ticker: string,
  name: string,
  data: EnhancedStockData
): ComparisonMetrics {
  const q = data.quote
  const rsi = data.technicals?.rsi ?? null

  // 이동평균 신호 판단
  let maSignal: "golden" | "dead" | "neutral" | null = null
  if (data.technicals) {
    const { priceVsSma50, priceVsSma200 } = data.technicals
    if (priceVsSma50 > 0 && priceVsSma200 > 0) maSignal = "golden"
    else if (priceVsSma50 < 0 && priceVsSma200 < 0) maSignal = "dead"
    else maSignal = "neutral"
  }

  // 부채비율 추출 (재무제표에서)
  let debtRatio: number | null = null
  if (data.financials) {
    const debtRow = data.financials.rows.find((r) =>
      r.title.includes("부채비율")
    )
    if (debtRow && debtRow.values.length > 0) {
      const lastVal = debtRow.values[debtRow.values.length - 1]
      if (lastVal) {
        const parsed = parseFloat(String(lastVal).replace(/,/g, ""))
        if (!isNaN(parsed)) debtRatio = parsed
      }
    }
  }

  // 매출 성장률 추출
  let revenueGrowth: number | null = null
  if (data.financials) {
    const revRow = data.financials.rows.find((r) =>
      r.title.includes("매출액")
    )
    if (revRow && revRow.values.length >= 2) {
      const cur = parseFloat(
        String(revRow.values[revRow.values.length - 1]).replace(/,/g, "")
      )
      const prev = parseFloat(
        String(revRow.values[revRow.values.length - 2]).replace(/,/g, "")
      )
      if (!isNaN(cur) && !isNaN(prev) && prev !== 0) {
        revenueGrowth = ((cur - prev) / Math.abs(prev)) * 100
      }
    }
  }

  return {
    ticker,
    name,
    price: q?.price ?? 0,
    changePercent: q?.changePercent ?? 0,
    per: q?.per ?? null,
    pbr: q?.pbr ?? null,
    eps: q?.eps ?? null,
    roe: null, // ROE는 재무제표에서 추출 가능하지만 quote에 없음
    dividendYield: q?.dividendYield ?? null,
    marketCap: q?.marketCap ?? null,
    aiScore: data.aiScore?.aiScore ?? null,
    targetPrice: data.consensus?.consensus.targetPrice ?? null,
    investmentOpinion: data.consensus?.consensus.investmentOpinion ?? null,
    rsi,
    maSignal,
    debtRatio,
    revenueGrowth,
  }
}

// ── Winner 판정 ────────────────────────────────────────────────

type MetricKey = keyof Omit<ComparisonMetrics, "ticker" | "name">

/** 높을수록 좋은 지표 */
const HIGHER_IS_BETTER: readonly MetricKey[] = [
  "price",
  "changePercent",
  "eps",
  "roe",
  "dividendYield",
  "marketCap",
  "aiScore",
  "targetPrice",
  "revenueGrowth",
]

/** 낮을수록 좋은 지표 */
const LOWER_IS_BETTER: readonly MetricKey[] = [
  "per",
  "pbr",
  "debtRatio",
]

function judgeWinner(
  a: ComparisonMetrics,
  b: ComparisonMetrics
): StockComparisonContext["winners"] {
  const result: Record<string, "A" | "B" | "tie"> = {}

  const allKeys: readonly MetricKey[] = [
    "price",
    "changePercent",
    "per",
    "pbr",
    "eps",
    "roe",
    "dividendYield",
    "marketCap",
    "aiScore",
    "targetPrice",
    "investmentOpinion",
    "rsi",
    "maSignal",
    "debtRatio",
    "revenueGrowth",
  ]

  for (const key of allKeys) {
    const valA = a[key]
    const valB = b[key]

    // 둘 다 null이면 tie
    if (valA == null && valB == null) {
      result[key] = "tie"
      continue
    }
    if (valA == null) {
      result[key] = "B"
      continue
    }
    if (valB == null) {
      result[key] = "A"
      continue
    }

    // 수치 비교 불가한 필드
    if (typeof valA !== "number" || typeof valB !== "number") {
      result[key] = "tie"
      continue
    }

    if (valA === valB) {
      result[key] = "tie"
      continue
    }

    if (HIGHER_IS_BETTER.includes(key)) {
      result[key] = valA > valB ? "A" : "B"
    } else if (LOWER_IS_BETTER.includes(key)) {
      result[key] = valA < valB ? "A" : "B"
    } else {
      result[key] = "tie"
    }
  }

  return result as StockComparisonContext["winners"]
}

// ── Context Builder ────────────────────────────────────────────

/** 두 종목 비교 컨텍스트를 프롬프트용 문자열로 변환 */
export function buildStockComparisonContext(
  stockA: { readonly ticker: string; readonly name: string },
  stockB: { readonly ticker: string; readonly name: string },
  dataA: EnhancedStockData,
  dataB: EnhancedStockData
): string {
  const metricsA = extractComparisonMetrics(stockA.ticker, stockA.name, dataA)
  const metricsB = extractComparisonMetrics(stockB.ticker, stockB.name, dataB)
  const winners = judgeWinner(metricsA, metricsB)

  const lines: string[] = []

  lines.push(`[종목 비교: ${metricsA.name} vs ${metricsB.name}]`)
  lines.push("")

  // 기본 지표 비교 테이블
  lines.push("[기본 지표 비교]")
  const fmt = (label: string, valA: string, valB: string, key: MetricKey) => {
    const w = winners[key]
    const winStr =
      w === "A" ? `${metricsA.name}` : w === "B" ? `${metricsB.name}` : "tie"
    return `${label.padEnd(16)}${valA.padEnd(16)}${valB.padEnd(16)}${winStr}`
  }

  lines.push(
    `${"지표".padEnd(16)}${metricsA.name.padEnd(16)}${metricsB.name.padEnd(16)}Winner`
  )

  const fmtPrice = (p: number) => (p > 0 ? `${p.toLocaleString()}원` : "N/A")
  const fmtPct = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`
  const fmtX = (v: number | null) => (v != null ? `${v.toFixed(1)}x` : "N/A")
  const fmtScore = (v: number | null) => (v != null ? `${v}` : "N/A")

  lines.push(fmt("현재가", fmtPrice(metricsA.price), fmtPrice(metricsB.price), "price"))
  lines.push(
    fmt("등락률", fmtPct(metricsA.changePercent), fmtPct(metricsB.changePercent), "changePercent")
  )
  lines.push(fmt("PER", fmtX(metricsA.per), fmtX(metricsB.per), "per"))
  lines.push(fmt("PBR", fmtX(metricsA.pbr), fmtX(metricsB.pbr), "pbr"))
  lines.push(
    fmt(
      "배당수익률",
      metricsA.dividendYield != null ? `${metricsA.dividendYield.toFixed(2)}%` : "N/A",
      metricsB.dividendYield != null ? `${metricsB.dividendYield.toFixed(2)}%` : "N/A",
      "dividendYield"
    )
  )
  lines.push(fmt("AI점수", fmtScore(metricsA.aiScore), fmtScore(metricsB.aiScore), "aiScore"))
  lines.push(
    fmt(
      "목표가",
      metricsA.targetPrice != null ? `${metricsA.targetPrice.toLocaleString()}원` : "N/A",
      metricsB.targetPrice != null ? `${metricsB.targetPrice.toLocaleString()}원` : "N/A",
      "targetPrice"
    )
  )

  // 기술적 현황
  lines.push("")
  lines.push("[기술적 현황]")

  const rsiLabel = (rsi: number | null) => {
    if (rsi == null) return "N/A"
    if (rsi >= 70) return `${rsi.toFixed(1)} (과매수)`
    if (rsi >= 60) return `${rsi.toFixed(1)} (과열 근접)`
    if (rsi <= 30) return `${rsi.toFixed(1)} (과매도)`
    return `${rsi.toFixed(1)} (중립)`
  }
  lines.push(
    `RSI: ${metricsA.name} ${rsiLabel(metricsA.rsi)} | ${metricsB.name} ${rsiLabel(metricsB.rsi)}`
  )

  const maLabel = (signal: "golden" | "dead" | "neutral" | null) => {
    if (signal === "golden") return "골든크로스"
    if (signal === "dead") return "데드크로스"
    if (signal === "neutral") return "중립"
    return "N/A"
  }
  lines.push(
    `이동평균: ${metricsA.name} ${maLabel(metricsA.maSignal)} | ${metricsB.name} ${maLabel(metricsB.maSignal)}`
  )

  // 재무 건전성
  lines.push("")
  lines.push("[재무 건전성]")

  const fmtGrowth = (v: number | null) =>
    v != null ? `${v >= 0 ? "+" : ""}${v.toFixed(1)}%` : "N/A"
  lines.push(
    `매출 성장(YoY): ${metricsA.name} ${fmtGrowth(metricsA.revenueGrowth)} | ${metricsB.name} ${fmtGrowth(metricsB.revenueGrowth)}`
  )

  const fmtDebt = (v: number | null) => (v != null ? `${v.toFixed(1)}%` : "N/A")
  lines.push(
    `부채비율: ${metricsA.name} ${fmtDebt(metricsA.debtRatio)} | ${metricsB.name} ${fmtDebt(metricsB.debtRatio)}`
  )

  return "\n" + lines.join("\n")
}
