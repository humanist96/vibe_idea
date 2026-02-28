import type { KrxStockEntry } from "./krx-types"

const NAVER_STOCK_API = "https://m.stock.naver.com/api/stocks/marketValue"
const PAGE_SIZE = 100

function parseNumber(value: string | number | undefined): number {
  if (value === undefined || value === null) return 0
  if (typeof value === "number") return value
  const cleaned = value.replace(/,/g, "")
  const num = Number(cleaned)
  return isNaN(num) ? 0 : num
}

interface NaverStockItem {
  readonly itemCode: string
  readonly stockName: string
  readonly closePrice: string
  readonly compareToPreviousClosePrice: string
  readonly fluctuationsRatio: string
  readonly accumulatedTradingVolume: string
  readonly marketValue: string
  readonly stockEndType: string
}

interface NaverResponse {
  readonly stocks: NaverStockItem[]
  readonly totalCount: number
}

async function fetchMarketPage(
  market: "KOSPI" | "KOSDAQ",
  page: number,
  signal?: AbortSignal
): Promise<NaverResponse> {
  const res = await fetch(
    `${NAVER_STOCK_API}/${market}?page=${page}&pageSize=${PAGE_SIZE}`,
    {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal,
    }
  )
  if (!res.ok) return { stocks: [], totalCount: 0 }
  return res.json()
}

function mapItem(
  item: NaverStockItem,
  market: "KOSPI" | "KOSDAQ"
): KrxStockEntry | null {
  // Filter to common stocks only
  if (item.stockEndType !== "stock") return null
  const ticker = item.itemCode
  if (!ticker || ticker.length !== 6) return null

  return {
    ticker,
    name: item.stockName,
    market,
    sector: "",
    price: parseNumber(item.closePrice),
    change: parseNumber(item.compareToPreviousClosePrice),
    changePercent: parseNumber(item.fluctuationsRatio),
    volume: parseNumber(item.accumulatedTradingVolume),
    marketCap: parseNumber(item.marketValue),
  }
}

async function fetchAllForMarket(
  market: "KOSPI" | "KOSDAQ",
  signal?: AbortSignal
): Promise<KrxStockEntry[]> {
  // First page to get totalCount
  const first = await fetchMarketPage(market, 1, signal)
  const totalPages = Math.ceil(first.totalCount / PAGE_SIZE)
  const results: KrxStockEntry[] = []

  for (const item of first.stocks) {
    const mapped = mapItem(item, market)
    if (mapped) results.push(mapped)
  }

  // Fetch remaining pages in parallel (batches of 5)
  for (let batch = 2; batch <= totalPages; batch += 5) {
    const pages = Array.from(
      { length: Math.min(5, totalPages - batch + 1) },
      (_, i) => batch + i
    )
    const responses = await Promise.allSettled(
      pages.map((p) => fetchMarketPage(market, p, signal))
    )
    for (const resp of responses) {
      if (resp.status === "fulfilled") {
        for (const item of resp.value.stocks) {
          const mapped = mapItem(item, market)
          if (mapped) results.push(mapped)
        }
      }
    }
  }

  return results
}

export async function fetchKrxAllStocks(): Promise<KrxStockEntry[]> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)

    const [kospi, kosdaq] = await Promise.all([
      fetchAllForMarket("KOSPI", controller.signal),
      fetchAllForMarket("KOSDAQ", controller.signal),
    ])

    clearTimeout(timeout)

    return [...kospi, ...kosdaq]
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Stock list fetch failed:", error)
    }
    return []
  }
}
