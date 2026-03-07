/**
 * Twelve Data API 클라이언트
 * 미국 주식: 히스토리, 기술지표, 검색, 배당, 통계
 *
 * Rate limit: 800 calls/day, 8 calls/min (무료)
 * 상용 사용 허용 (데이터 재배포/경쟁 서비스 구축 금지)
 */

import { cache, FIVE_MINUTES, ONE_HOUR, ONE_DAY } from "@/lib/cache/memory-cache"

const BASE_URL = "https://api.twelvedata.com"

function getApiKey(): string {
  const key = process.env.TWELVE_DATA_API_KEY
  if (!key) throw new Error("TWELVE_DATA_API_KEY is not configured")
  return key
}

async function fetchTwelve<T>(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<T> {
  const url = new URL(`${BASE_URL}${endpoint}`)
  url.searchParams.set("apikey", getApiKey())
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v)
  }

  const res = await fetch(url.toString(), { next: { revalidate: 0 } })
  if (!res.ok) {
    throw new Error(`TwelveData ${endpoint} failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

// ── Types ──────────────────────────────────────────────

export interface TwelveQuote {
  readonly symbol: string
  readonly name: string
  readonly exchange: string
  readonly mic_code: string
  readonly currency: string
  readonly datetime: string
  readonly timestamp: number
  readonly open: string
  readonly high: string
  readonly low: string
  readonly close: string
  readonly volume: string
  readonly previous_close: string
  readonly change: string
  readonly percent_change: string
  readonly average_volume: string
  readonly fifty_two_week: {
    readonly low: string
    readonly high: string
    readonly low_change: string
    readonly high_change: string
    readonly low_change_percent: string
    readonly high_change_percent: string
    readonly range: string
  }
  readonly is_market_open: boolean
}

export interface TwelveTimeSeries {
  readonly meta: {
    readonly symbol: string
    readonly interval: string
    readonly currency: string
    readonly exchange_timezone: string
    readonly exchange: string
    readonly mic_code: string
    readonly type: string
  }
  readonly values: readonly {
    readonly datetime: string
    readonly open: string
    readonly high: string
    readonly low: string
    readonly close: string
    readonly volume: string
  }[]
  readonly status: string
}

export interface TwelveSearchResult {
  readonly data: readonly {
    readonly symbol: string
    readonly instrument_name: string
    readonly exchange: string
    readonly mic_code: string
    readonly exchange_timezone: string
    readonly instrument_type: string
    readonly country: string
    readonly currency: string
  }[]
  readonly status: string
}

export interface TwelveEarnings {
  readonly earnings: readonly {
    readonly date: string
    readonly time: string
    readonly eps_estimate: number | null
    readonly eps_actual: number | null
    readonly difference: number | null
    readonly surprise_prc: number | null
  }[]
  readonly status: string
}

export interface TwelveDividend {
  readonly dividends: readonly {
    readonly ex_date: string
    readonly amount: number
  }[]
  readonly meta: {
    readonly symbol: string
  }
  readonly status: string
}

export interface TwelveStatistics {
  readonly statistics: {
    readonly valuations_metrics: {
      readonly market_capitalization: number | null
      readonly enterprise_value: number | null
      readonly trailing_pe: number | null
      readonly forward_pe: number | null
      readonly peg_ratio: number | null
      readonly price_to_sales_ttm: number | null
      readonly price_to_book_mrq: number | null
      readonly enterprise_to_revenue: number | null
      readonly enterprise_to_ebitda: number | null
    }
    readonly financials: {
      readonly revenue_ttm: number | null
      readonly gross_profit_ttm: number | null
      readonly ebitda: number | null
      readonly net_income_to_common_ttm: number | null
      readonly diluted_eps_ttm: number | null
      readonly quarterly_revenue_growth_yoy: number | null
      readonly quarterly_earnings_growth_yoy: number | null
      readonly return_on_equity_ttm: number | null
      readonly return_on_assets_ttm: number | null
      readonly operating_margin_ttm: number | null
      readonly profit_margin: number | null
    }
    readonly stock_statistics: {
      readonly shares_outstanding: number | null
      readonly float_shares: number | null
      readonly avg_10_volume: number | null
      readonly avg_90_volume: number | null
      readonly shares_short: number | null
      readonly short_ratio: number | null
      readonly beta: number | null
      readonly "52_week_high": number | null
      readonly "52_week_low": number | null
      readonly "50_day_ma": number | null
      readonly "200_day_ma": number | null
    }
    readonly dividends_and_splits: {
      readonly forward_annual_dividend_rate: number | null
      readonly forward_annual_dividend_yield: number | null
      readonly trailing_annual_dividend_rate: number | null
      readonly trailing_annual_dividend_yield: number | null
      readonly "5_year_average_dividend_yield": number | null
      readonly payout_ratio: number | null
      readonly dividend_date: string | null
      readonly ex_dividend_date: string | null
    }
  }
  readonly status: string
}

// ── API Functions ──────────────────────────────────────

/** 시세 조회 */
export async function getTwelveQuote(symbol: string): Promise<TwelveQuote | null> {
  const cacheKey = `twelve:quote:${symbol}`
  const cached = cache.get<TwelveQuote>(cacheKey)
  if (cached) return cached

  try {
    const data = await fetchTwelve<TwelveQuote>("/quote", { symbol })
    if (!data.name) return null
    cache.set(cacheKey, data, FIVE_MINUTES)
    return data
  } catch {
    return null
  }
}

/** 히스토리 (OHLCV 시계열) */
export async function getTwelveTimeSeries(
  symbol: string,
  interval: string = "1day",
  outputsize: number = 252
): Promise<TwelveTimeSeries | null> {
  const cacheKey = `twelve:ts:${symbol}:${interval}:${outputsize}`
  const cached = cache.get<TwelveTimeSeries>(cacheKey)
  if (cached) return cached

  try {
    const data = await fetchTwelve<TwelveTimeSeries>("/time_series", {
      symbol,
      interval,
      outputsize: String(outputsize),
    })
    if (data.status !== "ok") return null
    cache.set(cacheKey, data, ONE_HOUR)
    return data
  } catch {
    return null
  }
}

/** 종목 검색 */
export async function searchTwelve(query: string): Promise<TwelveSearchResult> {
  const cacheKey = `twelve:search:${query.toLowerCase()}`
  const cached = cache.get<TwelveSearchResult>(cacheKey)
  if (cached) return cached

  const data = await fetchTwelve<TwelveSearchResult>("/symbol_search", {
    symbol: query,
    outputsize: "20",
  })

  cache.set(cacheKey, data, ONE_HOUR)
  return data
}

/** 실적 조회 */
export async function getTwelveEarnings(symbol: string): Promise<TwelveEarnings | null> {
  const cacheKey = `twelve:earnings:${symbol}`
  const cached = cache.get<TwelveEarnings>(cacheKey)
  if (cached) return cached

  try {
    const data = await fetchTwelve<TwelveEarnings>("/earnings", { symbol })
    if (data.status !== "ok") return null
    cache.set(cacheKey, data, ONE_HOUR)
    return data
  } catch {
    return null
  }
}

/** 배당 조회 */
export async function getTwelveDividends(symbol: string): Promise<TwelveDividend | null> {
  const cacheKey = `twelve:dividends:${symbol}`
  const cached = cache.get<TwelveDividend>(cacheKey)
  if (cached) return cached

  try {
    const data = await fetchTwelve<TwelveDividend>("/dividends", {
      symbol,
      range: "5y",
    })
    if (data.status !== "ok") return null
    cache.set(cacheKey, data, ONE_DAY)
    return data
  } catch {
    return null
  }
}

/** 통계/지표 조회 */
export async function getTwelveStatistics(symbol: string): Promise<TwelveStatistics | null> {
  const cacheKey = `twelve:stats:${symbol}`
  const cached = cache.get<TwelveStatistics>(cacheKey)
  if (cached) return cached

  try {
    const data = await fetchTwelve<TwelveStatistics>("/statistics", { symbol })
    if (data.status !== "ok") return null
    cache.set(cacheKey, data, ONE_HOUR)
    return data
  } catch {
    return null
  }
}
