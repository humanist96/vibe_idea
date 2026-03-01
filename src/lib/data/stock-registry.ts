import "server-only"

import { fetchKrxAllStocks } from "./krx-client"
import type {
  KrxStockEntry,
  ScreenerParams,
  PaginatedResult,
} from "./krx-types"
import { STOCK_LIST, SECTORS } from "@/lib/constants/stocks"
import type { StockInfo } from "@/lib/constants/stocks"

const META_TTL = 24 * 60 * 60 * 1000 // 24 hours

// ---------- Market-hours-aware TTL ----------

const FIVE_MIN = 5 * 60 * 1000
const FIFTEEN_MIN = 15 * 60 * 1000
const THIRTY_MIN = 30 * 60 * 1000

// Korean public holidays (month-day). Add/remove as needed each year.
const KR_HOLIDAYS = new Set([
  "01-01", // 신정
  "03-01", // 삼일절
  "05-01", // 근로자의 날
  "05-05", // 어린이날
  "06-06", // 현충일
  "08-15", // 광복절
  "10-03", // 개천절
  "10-09", // 한글날
  "12-25", // 성탄절
])

function getKstNow(): Date {
  // UTC+9
  const utc = Date.now()
  return new Date(utc + 9 * 60 * 60 * 1000)
}

function isKoreanTradingDay(kst: Date): boolean {
  const day = kst.getUTCDay() // 0=Sun ... 6=Sat
  if (day === 0 || day === 6) return false

  const mm = String(kst.getUTCMonth() + 1).padStart(2, "0")
  const dd = String(kst.getUTCDate()).padStart(2, "0")
  return !KR_HOLIDAYS.has(`${mm}-${dd}`)
}

function getPriceTtl(): number {
  const kst = getKstNow()

  if (!isKoreanTradingDay(kst)) {
    return Infinity // No refresh on weekends / holidays
  }

  const hhmm = kst.getUTCHours() * 100 + kst.getUTCMinutes()

  if (hhmm >= 900 && hhmm < 1530) return FIVE_MIN      // 장중
  if (hhmm >= 800 && hhmm < 900) return FIFTEEN_MIN     // 장전 동시호가
  if (hhmm >= 1530 && hhmm < 1800) return THIRTY_MIN    // 장후 시간외
  return Infinity                                         // 야간 → 갱신 안 함
}

// ---------- Registry state ----------

interface RegistryState {
  stocks: Map<string, KrxStockEntry>
  sectors: string[]
  metaLoadedAt: number
  priceLoadedAt: number
  loading: Promise<void> | null
}

const state: RegistryState = {
  stocks: new Map(),
  sectors: [],
  metaLoadedAt: 0,
  priceLoadedAt: 0,
  loading: null,
}

function buildFallbackEntries(): KrxStockEntry[] {
  return STOCK_LIST.map((s) => ({
    ticker: s.ticker,
    name: s.name,
    market: s.market,
    sector: s.sector,
    price: 0,
    change: 0,
    changePercent: 0,
    volume: 0,
    marketCap: 0,
  }))
}

function extractSectors(stocks: Map<string, KrxStockEntry>): string[] {
  const sectorSet = new Set<string>()
  for (const stock of stocks.values()) {
    if (stock.sector) sectorSet.add(stock.sector)
  }
  return [...sectorSet].sort()
}

// Ticker → sector from hardcoded 89 stocks
const HARDCODED_SECTORS = new Map<string, string>(
  STOCK_LIST.map((s) => [s.ticker, s.sector])
)

async function loadFromSource(): Promise<void> {
  const entries = await fetchKrxAllStocks()

  if (entries.length > 0) {
    const newMap = new Map<string, KrxStockEntry>()
    for (const entry of entries) {
      if (!newMap.has(entry.ticker)) {
        const sector = entry.sector || HARDCODED_SECTORS.get(entry.ticker) || ""
        newMap.set(entry.ticker, sector !== entry.sector ? { ...entry, sector } : entry)
      }
    }
    state.stocks = newMap
    state.sectors = extractSectors(newMap)
    state.metaLoadedAt = Date.now()
    state.priceLoadedAt = Date.now()
  } else if (state.stocks.size === 0) {
    const fallback = buildFallbackEntries()
    const fallbackMap = new Map<string, KrxStockEntry>()
    for (const entry of fallback) {
      fallbackMap.set(entry.ticker, entry)
    }
    state.stocks = fallbackMap
    state.sectors = [...SECTORS]
    state.metaLoadedAt = Date.now()
    state.priceLoadedAt = Date.now()
  }
}

// ---------- Public API ----------

export async function ensureLoaded(): Promise<void> {
  const now = Date.now()
  if (state.stocks.size > 0 && now - state.metaLoadedAt < META_TTL) {
    return
  }

  if (state.loading) {
    await state.loading
    return
  }

  state.loading = loadFromSource().finally(() => {
    state.loading = null
  })
  await state.loading
}

export async function ensurePricingFresh(): Promise<void> {
  const ttl = getPriceTtl()
  if (ttl === Infinity) return // Off-hours — skip

  const now = Date.now()
  if (now - state.priceLoadedAt < ttl) return

  // Stale-while-revalidate: fire-and-forget if data already exists
  if (state.stocks.size > 0) {
    if (!state.loading) {
      state.loading = loadFromSource().finally(() => {
        state.loading = null
      })
    }
    // Don't await — return stale data immediately
    return
  }

  // First load — must wait
  if (state.loading) {
    await state.loading
    return
  }
  state.loading = loadFromSource().finally(() => {
    state.loading = null
  })
  await state.loading
}

export function findStock(ticker: string): StockInfo | undefined {
  const entry = state.stocks.get(ticker)
  if (!entry) return undefined
  return {
    ticker: entry.ticker,
    name: entry.name,
    market: entry.market,
    sector: entry.sector,
  }
}

export function searchStocks(query: string, limit = 20): StockInfo[] {
  const q = query.toLowerCase()
  const results: StockInfo[] = []

  for (const entry of state.stocks.values()) {
    if (results.length >= limit) break
    if (
      entry.ticker.includes(q) ||
      entry.name.toLowerCase().includes(q) ||
      entry.sector.toLowerCase().includes(q)
    ) {
      results.push({
        ticker: entry.ticker,
        name: entry.name,
        market: entry.market,
        sector: entry.sector,
      })
    }
  }

  return results
}

export function getSectors(): string[] {
  return state.sectors
}

export function getAllStocksCount(): number {
  return state.stocks.size
}

export function getStockEntry(ticker: string): KrxStockEntry | undefined {
  return state.stocks.get(ticker)
}

function sortEntries(
  entries: KrxStockEntry[],
  sort: string,
  order: "asc" | "desc"
): KrxStockEntry[] {
  const field = sort as keyof KrxStockEntry
  return [...entries].sort((a, b) => {
    const aVal = a[field] ?? 0
    const bVal = b[field] ?? 0
    if (typeof aVal === "string" && typeof bVal === "string") {
      return order === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal)
    }
    return order === "asc"
      ? (aVal as number) - (bVal as number)
      : (bVal as number) - (aVal as number)
  })
}

export function getScreenerStocks(
  params: ScreenerParams
): PaginatedResult<KrxStockEntry> {
  let entries = [...state.stocks.values()]

  if (params.market !== "ALL") {
    entries = entries.filter((e) => e.market === params.market)
  }

  if (params.sector) {
    entries = entries.filter((e) => e.sector === params.sector)
  }

  if (params.search) {
    const q = params.search.toLowerCase()
    entries = entries.filter(
      (e) =>
        e.ticker.includes(q) ||
        e.name.toLowerCase().includes(q) ||
        e.sector.toLowerCase().includes(q)
    )
  }

  if (params.minPrice !== undefined) {
    entries = entries.filter((e) => e.price >= params.minPrice!)
  }
  if (params.maxPrice !== undefined) {
    entries = entries.filter((e) => e.price <= params.maxPrice!)
  }
  if (params.minChangePercent !== undefined) {
    entries = entries.filter((e) => e.changePercent >= params.minChangePercent!)
  }
  if (params.maxChangePercent !== undefined) {
    entries = entries.filter((e) => e.changePercent <= params.maxChangePercent!)
  }
  if (params.minMarketCap !== undefined) {
    entries = entries.filter((e) => e.marketCap >= params.minMarketCap!)
  }
  if (params.maxMarketCap !== undefined) {
    entries = entries.filter((e) => e.marketCap <= params.maxMarketCap!)
  }

  const sorted = sortEntries(entries, params.sort || "marketCap", params.order)

  const total = sorted.length
  const totalPages = Math.max(1, Math.ceil(total / params.limit))
  const page = Math.min(params.page, totalPages)
  const start = (page - 1) * params.limit
  const data = sorted.slice(start, start + params.limit)

  return {
    data,
    meta: { total, page, limit: params.limit, totalPages },
  }
}

export function getTopStocksFromRegistry(
  limit: number
): KrxStockEntry[] {
  const entries = [...state.stocks.values()]
  return sortEntries(entries, "marketCap", "desc").slice(0, limit)
}
