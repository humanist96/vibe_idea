/**
 * Financial Modeling Prep (FMP) API 클라이언트
 * 새 Stable API 사용 (2025.08 이후)
 *
 * 무료 250 calls/day
 */

import { cache, ONE_HOUR, ONE_DAY } from "@/lib/cache/memory-cache"

const BASE_URL = "https://financialmodelingprep.com"

function getApiKey(): string {
  const key = process.env.FMP_API_KEY
  if (!key) throw new Error("FMP_API_KEY is not configured")
  return key
}

async function fetchFmp<T>(
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
    throw new Error(`FMP ${endpoint} failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

// ── Types ──────────────────────────────────────────────

export interface FmpProfile {
  readonly symbol: string
  readonly price: number
  readonly beta: number
  readonly volAvg: number
  readonly mktCap: number
  readonly marketCap: number
  readonly lastDividend: number
  readonly range: string
  readonly change: number
  readonly changePercentage: number
  readonly companyName: string
  readonly currency: string
  readonly exchange: string
  readonly exchangeFullName: string
  readonly industry: string
  readonly website: string
  readonly description: string
  readonly ceo: string
  readonly sector: string
  readonly country: string
  readonly fullTimeEmployees: string
  readonly phone: string
  readonly address: string
  readonly city: string
  readonly state: string
  readonly image: string
  readonly ipoDate: string
  readonly volume: number
  readonly averageVolume: number
}

// ── API Functions ──────────────────────────────────────

/** 기업 프로필 (Stable API) */
export async function getFmpProfile(symbol: string): Promise<FmpProfile | null> {
  const cacheKey = `fmp:profile:${symbol}`
  const cached = cache.get<FmpProfile>(cacheKey)
  if (cached) return cached

  try {
    const data = await fetchFmp<FmpProfile[]>("/stable/profile", { symbol })
    if (!data[0]) return null
    cache.set(cacheKey, data[0], ONE_DAY)
    return data[0]
  } catch {
    return null
  }
}

/** 종목 검색 (Stable API) */
export async function searchFmp(query: string): Promise<readonly {
  readonly symbol: string
  readonly name: string
  readonly currency: string
  readonly exchangeShortName: string
}[]> {
  const cacheKey = `fmp:search:${query.toLowerCase()}`
  const cached = cache.get<readonly {
    readonly symbol: string
    readonly name: string
    readonly currency: string
    readonly exchangeShortName: string
  }[]>(cacheKey)
  if (cached) return cached

  try {
    const data = await fetchFmp<{
      readonly symbol: string
      readonly name: string
      readonly currency: string
      readonly exchangeShortName: string
    }[]>("/stable/search", { query, limit: "20" })
    cache.set(cacheKey, data, ONE_HOUR)
    return data
  } catch {
    return []
  }
}
