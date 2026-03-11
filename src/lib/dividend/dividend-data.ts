/**
 * 배당 데이터 통합 레이어
 * KR (DART) + US (Twelve Data, Finnhub) 데이터를 DividendStock 형태로 정규화
 */

import "server-only"

import { cache, ONE_DAY, ONE_HOUR } from "@/lib/cache/memory-cache"
import { getDividendInfo } from "@/lib/api/dart-dividend"
import { getQuote as getNaverQuote } from "@/lib/api/naver-finance"
import type { DividendInfo } from "@/lib/api/dart-dividend-types"
import { getTwelveDividends, getTwelveStatistics } from "@/lib/api/twelve-data"
import { getUSMetrics, getUSQuote } from "@/lib/api/finnhub"
import { findUSStock, getAllUSStocks } from "@/lib/data/us-stock-registry"
import { STOCK_LIST, findStock } from "@/lib/constants/stocks"
import { scoreToGrade } from "./scoring"
import type {
  DividendStock,
  DividendHistoryEntry,
  DividendFrequency,
  DividendMarket,
} from "./dividend-types"

// ── 상수 ──────────────────────────────

const PAYOUT_SAFE_MAX = 40
const PAYOUT_MODERATE_MAX = 60
const PAYOUT_WARNING_MAX = 80
const CONSECUTIVE_EXCELLENT = 25
const CONSECUTIVE_GOOD = 10
const CONSECUTIVE_FAIR = 5
const CONSECUTIVE_MIN = 3
const GROWTH_EXCELLENT = 10
const GROWTH_GOOD = 5
const FCF_EXCELLENT = 2
const FCF_GOOD = 1.5
const US_BATCH_SIZE = 5
const US_BATCH_DELAY_MS = 200

// ── 안전 점수 계산 ──────────────────────────────

function payoutScore(payoutRatio: number | null): number {
  if (payoutRatio === null) return 0
  if (payoutRatio <= PAYOUT_SAFE_MAX) return 15
  if (payoutRatio <= PAYOUT_MODERATE_MAX) return 10
  if (payoutRatio <= PAYOUT_WARNING_MAX) return 0
  return -15
}

function consecutiveScore(years: number): number {
  if (years >= CONSECUTIVE_EXCELLENT) return 20
  if (years >= CONSECUTIVE_GOOD) return 15
  if (years >= CONSECUTIVE_FAIR) return 10
  if (years >= CONSECUTIVE_MIN) return 5
  return 0
}

function growthScore(rate: number | null): number {
  if (rate === null) return 0
  if (rate >= GROWTH_EXCELLENT) return 10
  if (rate >= GROWTH_GOOD) return 7
  if (rate >= 0) return 3
  return -10
}

function fcfScore(coverage: number | null): number {
  if (coverage === null) return 0
  if (coverage >= FCF_EXCELLENT) return 10
  if (coverage >= FCF_GOOD) return 7
  if (coverage >= 1) return 3
  return -10
}

export function calcSafetyScore(
  payoutRatio: number | null,
  consecutiveYears: number,
  dividendGrowthRate: number | null,
  fcfCoverage: number | null
): number {
  const base = 50
  const total =
    base +
    payoutScore(payoutRatio) +
    consecutiveScore(consecutiveYears) +
    growthScore(dividendGrowthRate) +
    fcfScore(fcfCoverage)
  return Math.max(0, Math.min(100, total))
}

// ── KR 배당 데이터 ──────────────────────────────

function calcConsecutiveYears(history: readonly DividendHistoryEntry[]): number {
  const sorted = [...history].sort((a, b) => b.year - a.year)
  let count = 0
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].amount > sorted[i + 1].amount && sorted[i + 1].amount > 0) {
      count++
    } else {
      break
    }
  }
  return count
}

function calcGrowthRate(history: readonly DividendHistoryEntry[]): number | null {
  const sorted = [...history].sort((a, b) => a.year - b.year)
  const valid = sorted.filter((h) => h.amount > 0)
  if (valid.length < 2) return null

  const first = valid[0]
  const last = valid[valid.length - 1]
  const years = last.year - first.year
  if (years <= 0 || first.amount <= 0) return null

  const cagr = (Math.pow(last.amount / first.amount, 1 / years) - 1) * 100
  return Number(cagr.toFixed(1))
}

export async function getKRDividendStock(
  ticker: string
): Promise<DividendStock | null> {
  const cacheKey = `dividend-lab:kr:${ticker}`
  const cached = cache.get<DividendStock>(cacheKey)
  if (cached) return cached

  const stockInfo = findStock(ticker)
  if (!stockInfo) return null

  try {
    const currentYear = new Date().getFullYear()
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 1 - i)

    const results = await Promise.allSettled(
      years.map((y) => getDividendInfo(ticker, y))
    )

    const dividendHistory: DividendHistoryEntry[] = []
    let latestDividend: DividendInfo | null = null

    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      if (result.status === "fulfilled" && result.value) {
        const info = result.value
        if (!latestDividend) latestDividend = info
        dividendHistory.push({
          year: years[i],
          amount: info.dividendPerShare,
          yield: info.dividendYield,
        })
      }
    }

    if (!latestDividend) return null

    // 현재가, 시총, PER/PBR 조회 (Naver Finance)
    const naverQuote = await getNaverQuote(ticker).catch(() => null)

    const consecutiveYears = calcConsecutiveYears(dividendHistory)
    const growthRate = calcGrowthRate(dividendHistory)
    const safetyScore = calcSafetyScore(
      latestDividend.payoutRatio ?? null,
      consecutiveYears,
      growthRate,
      null
    )

    const stock: DividendStock = {
      ticker,
      name: stockInfo.name,
      nameKr: stockInfo.name,
      market: "KR",
      sector: stockInfo.sector,
      sectorKr: stockInfo.sector,
      currentPrice: naverQuote?.price ?? 0,
      currency: "KRW",
      dividendYield: latestDividend.dividendYield,
      dividendPerShare: latestDividend.dividendPerShare,
      payoutRatio: latestDividend.payoutRatio ?? null,
      dividendGrowthRate: growthRate,
      consecutiveYears,
      frequency: "annual",
      exDividendDate: null,
      paymentDate: null,
      paymentMonths: [12],
      marketCap: naverQuote?.marketCap ?? null,
      per: naverQuote?.per ?? null,
      pbr: naverQuote?.pbr ?? null,
      safetyScore,
      safetyGrade: scoreToGrade(safetyScore),
      fcfCoverage: null,
      debtToEquity: null,
      dividendHistory: [...dividendHistory].sort((a, b) => a.year - b.year),
    }

    cache.set(cacheKey, stock, ONE_DAY)
    return stock
  } catch {
    return null
  }
}

// ── US 배당 데이터 ──────────────────────────────

function deriveFrequency(
  dividends: readonly { ex_date: string; amount: number }[]
): { frequency: DividendFrequency; paymentMonths: number[] } {
  if (dividends.length === 0) {
    return { frequency: "annual", paymentMonths: [12] }
  }

  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  const recentDivs = dividends.filter(
    (d) => new Date(d.ex_date) >= oneYearAgo
  )

  const months = [
    ...new Set(recentDivs.map((d) => new Date(d.ex_date).getMonth() + 1)),
  ].sort((a, b) => a - b)

  const count = recentDivs.length
  let frequency: DividendFrequency = "annual"
  if (count >= 10) frequency = "monthly"
  else if (count >= 3) frequency = "quarterly"
  else if (count >= 2) frequency = "semi"

  return {
    frequency,
    paymentMonths: months.length > 0 ? months : [12],
  }
}

/**
 * US 배당률 정규화: Twelve Data는 소수(0.035 = 3.5%), Finnhub는 %(3.5 = 3.5%)
 * 1 미만이면 소수 → %, 1 이상이면 이미 %
 */
function normalizeYieldToPercent(value: number): number {
  if (value > 0 && value < 1) {
    return Number((value * 100).toFixed(2))
  }
  return Number(value.toFixed(2))
}

function normalizeRatioToPercent(value: number | null): number | null {
  if (value === null) return null
  if (value > 0 && value < 1) {
    return Number((value * 100).toFixed(1))
  }
  return Number(value.toFixed(1))
}

export async function getUSDividendStock(
  symbol: string
): Promise<DividendStock | null> {
  const cacheKey = `dividend-lab:us:${symbol}`
  const cached = cache.get<DividendStock>(cacheKey)
  if (cached) return cached

  const entry = findUSStock(symbol)
  if (!entry) return null

  try {
    const [dividendsResult, statsResult, metricsResult, quoteResult] =
      await Promise.allSettled([
        getTwelveDividends(symbol),
        getTwelveStatistics(symbol),
        getUSMetrics(symbol),
        getUSQuote(symbol),
      ])

    const dividends =
      dividendsResult.status === "fulfilled" ? dividendsResult.value : null
    const stats =
      statsResult.status === "fulfilled" ? statsResult.value : null
    const metrics =
      metricsResult.status === "fulfilled" ? metricsResult.value : null
    const usQuote =
      quoteResult.status === "fulfilled" ? quoteResult.value : null

    const divsSplits = stats?.statistics?.dividends_and_splits

    const rawYield =
      divsSplits?.forward_annual_dividend_yield ??
      (metrics?.metric?.dividendYieldIndicatedAnnual as number | undefined) ??
      0

    const dividendPerShare =
      divsSplits?.forward_annual_dividend_rate ??
      (metrics?.metric?.dividendPerShareAnnual as number | undefined) ??
      0

    const dividendYield = normalizeYieldToPercent(rawYield)

    if (dividendYield === 0 && dividendPerShare === 0) return null

    const payoutRatio = normalizeRatioToPercent(
      divsSplits?.payout_ratio ?? null
    )

    // 배당 이력 구성
    const divList = dividends?.dividends ?? []
    const yearMap = new Map<number, number>()
    for (const d of divList) {
      const year = new Date(d.ex_date).getFullYear()
      yearMap.set(year, (yearMap.get(year) ?? 0) + d.amount)
    }

    const dividendHistory: DividendHistoryEntry[] = Array.from(
      yearMap.entries()
    )
      .map(([year, amount]) => ({
        year,
        amount: Number(amount.toFixed(4)),
        yield: 0,
      }))
      .sort((a, b) => a.year - b.year)

    const consecutiveYears = calcConsecutiveYears(dividendHistory)
    const growthRate = calcGrowthRate(dividendHistory)

    const { frequency, paymentMonths } = deriveFrequency(divList)

    const safetyScore = calcSafetyScore(
      payoutRatio,
      consecutiveYears,
      growthRate,
      null
    )

    // Finnhub metrics에서 밸류에이션 데이터 추출
    const rawMarketCap = metrics?.metric?.marketCapitalization ?? null
    const usMarketCap = typeof rawMarketCap === "number" ? rawMarketCap : null
    const rawPe = metrics?.metric?.peAnnual ?? null
    const usPer = typeof rawPe === "number" ? rawPe : null
    const rawPb = metrics?.metric?.pbAnnual ?? null
    const usPbr = typeof rawPb === "number" ? rawPb : null

    const stock: DividendStock = {
      ticker: symbol,
      name: entry.name,
      nameKr: entry.nameKr,
      market: "US",
      sector: entry.sector,
      sectorKr: entry.sectorKr,
      currentPrice: usQuote?.c ?? 0,
      currency: "USD",
      dividendYield,
      dividendPerShare: Number(dividendPerShare.toFixed(4)),
      payoutRatio,
      dividendGrowthRate: growthRate,
      consecutiveYears,
      frequency,
      exDividendDate: divsSplits?.ex_dividend_date ?? null,
      paymentDate: divsSplits?.dividend_date ?? null,
      paymentMonths,
      marketCap: usMarketCap,
      per: usPer,
      pbr: usPbr,
      safetyScore,
      safetyGrade: scoreToGrade(safetyScore),
      fcfCoverage: null,
      debtToEquity: null,
      dividendHistory,
    }

    cache.set(cacheKey, stock, ONE_DAY)
    return stock
  } catch {
    return null
  }
}

// ── 배치 조회 (concurrent-safe) ──────────────────

export async function getDividendStockBatch(
  tickers: readonly { ticker: string; market: DividendMarket }[]
): Promise<ReadonlyMap<string, DividendStock>> {
  const settled = await Promise.allSettled(
    tickers.map(async ({ ticker, market }) => {
      const stock =
        market === "KR"
          ? await getKRDividendStock(ticker)
          : await getUSDividendStock(ticker)
      return stock ? ({ key: `${market}:${ticker}`, stock } as const) : null
    })
  )

  const results = new Map<string, DividendStock>()
  for (const result of settled) {
    if (result.status === "fulfilled" && result.value) {
      results.set(result.value.key, result.value.stock)
    }
  }
  return results
}

// ── 전체 배당주 유니버스 (스크리너용) ──────────────────

export async function getAllDividendStocks(
  market: DividendMarket | "ALL"
): Promise<readonly DividendStock[]> {
  const cacheKey = `dividend-lab:universe:${market}`
  const cached = cache.get<readonly DividendStock[]>(cacheKey)
  if (cached) return cached

  const stocks: DividendStock[] = []

  if (market === "KR" || market === "ALL") {
    const krTickers = STOCK_LIST.map((s) => s.ticker)
    const krResults = await Promise.allSettled(
      krTickers.map((t) => getKRDividendStock(t))
    )
    for (const r of krResults) {
      if (r.status === "fulfilled" && r.value) {
        stocks.push(r.value)
      }
    }
  }

  if (market === "US" || market === "ALL") {
    const usSymbols = getAllUSStocks().map((s) => s.symbol)
    for (let i = 0; i < usSymbols.length; i += US_BATCH_SIZE) {
      const batch = usSymbols.slice(i, i + US_BATCH_SIZE)
      const results = await Promise.allSettled(
        batch.map((s) => getUSDividendStock(s))
      )
      for (const r of results) {
        if (r.status === "fulfilled" && r.value) {
          stocks.push(r.value)
        }
      }
      if (i + US_BATCH_SIZE < usSymbols.length) {
        await new Promise((resolve) => setTimeout(resolve, US_BATCH_DELAY_MS))
      }
    }
  }

  cache.set(cacheKey, stocks, ONE_HOUR)
  return stocks
}
