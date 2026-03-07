/**
 * Finnhub API 클라이언트
 * 미국 주식: 실시간 시세, 기업 프로필, 뉴스, 검색, 캔들 데이터, 실적 캘린더, 기본 지표
 *
 * Rate limit: 60 calls/min (무료)
 */

import { cache, FIVE_MINUTES, ONE_HOUR, ONE_DAY } from "@/lib/cache/memory-cache"

const BASE_URL = "https://finnhub.io/api/v1"

function getApiKey(): string {
  const key = process.env.FINNHUB_API_KEY
  if (!key) throw new Error("FINNHUB_API_KEY is not configured")
  return key
}

async function fetchFinnhub<T>(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<T> {
  const url = new URL(`${BASE_URL}${endpoint}`)
  url.searchParams.set("token", getApiKey())
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v)
  }

  const res = await fetch(url.toString(), { next: { revalidate: 0 } })
  if (!res.ok) {
    throw new Error(`Finnhub ${endpoint} failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

// ── Types ──────────────────────────────────────────────

export interface FinnhubQuote {
  readonly c: number   // Current price
  readonly d: number   // Change
  readonly dp: number  // Percent change
  readonly h: number   // High
  readonly l: number   // Low
  readonly o: number   // Open
  readonly pc: number  // Previous close
  readonly t: number   // Timestamp
}

export interface FinnhubProfile {
  readonly country: string
  readonly currency: string
  readonly exchange: string
  readonly finnhubIndustry: string
  readonly ipo: string
  readonly logo: string
  readonly marketCapitalization: number
  readonly name: string
  readonly phone: string
  readonly shareOutstanding: number
  readonly ticker: string
  readonly weburl: string
}

export interface FinnhubCandle {
  readonly c: readonly number[]  // Close
  readonly h: readonly number[]  // High
  readonly l: readonly number[]  // Low
  readonly o: readonly number[]  // Open
  readonly t: readonly number[]  // Timestamp
  readonly v: readonly number[]  // Volume
  readonly s: string             // Status
}

export interface FinnhubNewsItem {
  readonly category: string
  readonly datetime: number
  readonly headline: string
  readonly id: number
  readonly image: string
  readonly related: string
  readonly source: string
  readonly summary: string
  readonly url: string
}

export interface FinnhubSearchResult {
  readonly count: number
  readonly result: readonly {
    readonly description: string
    readonly displaySymbol: string
    readonly symbol: string
    readonly type: string
  }[]
}

export interface FinnhubEarningsEvent {
  readonly date: string
  readonly epsActual: number | null
  readonly epsEstimate: number | null
  readonly hour: string  // "bmo" | "amc" | "dmh"
  readonly quarter: number
  readonly revenueActual: number | null
  readonly revenueEstimate: number | null
  readonly symbol: string
  readonly year: number
}

export interface FinnhubMetrics {
  readonly metric: {
    readonly "10DayAverageTradingVolume"?: number
    readonly "52WeekHigh"?: number
    readonly "52WeekLow"?: number
    readonly "52WeekHighDate"?: string
    readonly "52WeekLowDate"?: string
    readonly beta?: number
    readonly bookValuePerShareAnnual?: number
    readonly dividendPerShareAnnual?: number
    readonly dividendYieldIndicatedAnnual?: number
    readonly epsAnnual?: number
    readonly epsGrowthTTMYoy?: number
    readonly marketCapitalization?: number
    readonly peAnnual?: number
    readonly pbAnnual?: number
    readonly revenuePerShareTTM?: number
    readonly roeTTM?: number
    readonly [key: string]: number | string | undefined
  }
}

export interface FinnhubMarketStatus {
  readonly exchange: string
  readonly holiday: string | null
  readonly isOpen: boolean
  readonly session: string
  readonly timezone: string
  readonly t: number
}

// ── API Functions ──────────────────────────────────────

/** 실시간 시세 */
export async function getUSQuote(symbol: string): Promise<FinnhubQuote> {
  const cacheKey = `finnhub:quote:${symbol}`
  const cached = cache.get<FinnhubQuote>(cacheKey)
  if (cached) return cached

  const data = await fetchFinnhub<FinnhubQuote>("/quote", { symbol })
  cache.set(cacheKey, data, FIVE_MINUTES)
  return data
}

/** 기업 프로필 */
export async function getUSProfile(symbol: string): Promise<FinnhubProfile | null> {
  const cacheKey = `finnhub:profile:${symbol}`
  const cached = cache.get<FinnhubProfile>(cacheKey)
  if (cached) return cached

  try {
    const data = await fetchFinnhub<FinnhubProfile>("/stock/profile2", { symbol })
    if (!data.name) return null
    cache.set(cacheKey, data, ONE_DAY)
    return data
  } catch {
    return null
  }
}

/** OHLCV 캔들 데이터 */
export async function getUSCandle(
  symbol: string,
  resolution: string = "D",
  from?: number,
  to?: number
): Promise<FinnhubCandle> {
  const now = Math.floor(Date.now() / 1000)
  const defaultFrom = now - 365 * 24 * 60 * 60 // 1년 전

  const cacheKey = `finnhub:candle:${symbol}:${resolution}:${from ?? defaultFrom}`
  const cached = cache.get<FinnhubCandle>(cacheKey)
  if (cached) return cached

  const data = await fetchFinnhub<FinnhubCandle>("/stock/candle", {
    symbol,
    resolution,
    from: String(from ?? defaultFrom),
    to: String(to ?? now),
  })

  cache.set(cacheKey, data, ONE_HOUR)
  return data
}

/** 기업 뉴스 */
export async function getUSNews(
  symbol: string,
  days: number = 7
): Promise<readonly FinnhubNewsItem[]> {
  const cacheKey = `finnhub:news:${symbol}`
  const cached = cache.get<readonly FinnhubNewsItem[]>(cacheKey)
  if (cached) return cached

  const to = new Date()
  const from = new Date(to)
  from.setDate(from.getDate() - days)

  const data = await fetchFinnhub<FinnhubNewsItem[]>("/company-news", {
    symbol,
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  })

  const result = data.slice(0, 20)
  cache.set(cacheKey, result, FIVE_MINUTES * 3) // 15분
  return result
}

/** 종목 검색 */
export async function searchUSStocks(query: string): Promise<FinnhubSearchResult> {
  const cacheKey = `finnhub:search:${query.toLowerCase()}`
  const cached = cache.get<FinnhubSearchResult>(cacheKey)
  if (cached) return cached

  const data = await fetchFinnhub<FinnhubSearchResult>("/search", { q: query })
  cache.set(cacheKey, data, ONE_HOUR)
  return data
}

/** 실적 캘린더 (이번 주/다음 주) */
export async function getUSEarningsCalendar(
  from?: string,
  to?: string
): Promise<readonly FinnhubEarningsEvent[]> {
  const today = new Date()
  const defaultFrom = today.toISOString().slice(0, 10)
  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 14)
  const defaultTo = nextWeek.toISOString().slice(0, 10)

  const f = from ?? defaultFrom
  const t = to ?? defaultTo
  const cacheKey = `finnhub:earnings:${f}:${t}`
  const cached = cache.get<readonly FinnhubEarningsEvent[]>(cacheKey)
  if (cached) return cached

  const data = await fetchFinnhub<{ readonly earningsCalendar: readonly FinnhubEarningsEvent[] }>(
    "/calendar/earnings",
    { from: f, to: t }
  )

  const result = data.earningsCalendar ?? []
  cache.set(cacheKey, result, ONE_HOUR)
  return result
}

/** 기본 재무 지표 */
export async function getUSMetrics(symbol: string): Promise<FinnhubMetrics | null> {
  const cacheKey = `finnhub:metrics:${symbol}`
  const cached = cache.get<FinnhubMetrics>(cacheKey)
  if (cached) return cached

  try {
    const data = await fetchFinnhub<FinnhubMetrics>("/stock/metric", {
      symbol,
      metric: "all",
    })
    cache.set(cacheKey, data, ONE_HOUR)
    return data
  } catch {
    return null
  }
}

/** 여러 종목 시세 일괄 조회 (배치 5개씩 순차 처리) */
export async function getUSQuoteBatch(
  symbols: readonly string[]
): Promise<ReadonlyMap<string, FinnhubQuote>> {
  const results = new Map<string, FinnhubQuote>()
  const BATCH_SIZE = 5

  for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
    const batch = symbols.slice(i, i + BATCH_SIZE)
    const settled = await Promise.allSettled(
      batch.map(async (symbol) => {
        const quote = await getUSQuote(symbol)
        return { symbol, quote }
      })
    )

    for (const result of settled) {
      if (result.status === "fulfilled" && result.value.quote.c > 0) {
        results.set(result.value.symbol, result.value.quote)
      }
    }
  }

  return results
}

// ── New Types ─────────────────────────────────────────

export interface FinnhubInsiderTransaction {
  readonly name: string
  readonly share: number
  readonly change: number
  readonly filingDate: string
  readonly transactionDate: string
  readonly transactionCode: string
  readonly transactionPrice: number
  readonly symbol: string
}

export interface FinnhubInsiderResponse {
  readonly data: readonly FinnhubInsiderTransaction[]
  readonly symbol: string
}

export interface FinnhubIPOEvent {
  readonly date: string
  readonly exchange: string
  readonly name: string
  readonly numberOfShares: number
  readonly price: string
  readonly status: string
  readonly symbol: string
  readonly totalSharesValue: number
}

export interface FinnhubIPOResponse {
  readonly ipoCalendar: readonly FinnhubIPOEvent[]
}

// ── Insider & IPO API Functions ──────────────────────

/** 내부자 거래 조회 */
export async function getUSInsiderTransactions(
  symbol: string
): Promise<readonly FinnhubInsiderTransaction[]> {
  const cacheKey = `finnhub:insider:${symbol}`
  const cached = cache.get<readonly FinnhubInsiderTransaction[]>(cacheKey)
  if (cached) return cached

  try {
    const data = await fetchFinnhub<FinnhubInsiderResponse>(
      "/stock/insider-transactions",
      { symbol }
    )
    const result = data.data ?? []
    cache.set(cacheKey, result, ONE_HOUR)
    return result
  } catch {
    return []
  }
}

/** IPO 캘린더 조회 */
export async function getUSIPOCalendar(
  from?: string,
  to?: string
): Promise<readonly FinnhubIPOEvent[]> {
  const today = new Date()
  const defaultFrom = new Date(today)
  defaultFrom.setDate(defaultFrom.getDate() - 30)
  const futureDate = new Date(today)
  futureDate.setDate(futureDate.getDate() + 30)

  const f = from ?? defaultFrom.toISOString().slice(0, 10)
  const t = to ?? futureDate.toISOString().slice(0, 10)
  const cacheKey = `finnhub:ipo:${f}:${t}`
  const cached = cache.get<readonly FinnhubIPOEvent[]>(cacheKey)
  if (cached) return cached

  try {
    const data = await fetchFinnhub<FinnhubIPOResponse>("/calendar/ipo", {
      from: f,
      to: t,
    })
    const result = data.ipoCalendar ?? []
    cache.set(cacheKey, result, ONE_HOUR)
    return result
  } catch {
    return []
  }
}

/** 미국 시장 상태 (장중/장전/장후) */
export async function getUSMarketStatus(): Promise<FinnhubMarketStatus> {
  const cacheKey = "finnhub:market-status"
  const cached = cache.get<FinnhubMarketStatus>(cacheKey)
  if (cached) return cached

  const data = await fetchFinnhub<FinnhubMarketStatus>("/stock/market-status", {
    exchange: "US",
  })

  cache.set(cacheKey, data, FIVE_MINUTES)
  return data
}
