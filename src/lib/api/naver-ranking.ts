import { cache, FIVE_MINUTES } from "@/lib/cache/memory-cache"

const NAVER_STOCK_API = "https://m.stock.naver.com/api"
const HEADERS = { "User-Agent": "Mozilla/5.0" }

export type RankingType = "up" | "down"
export type MarketType = "KOSPI" | "KOSDAQ"

export interface RankingStock {
  readonly rank: number
  readonly ticker: string
  readonly name: string
  readonly price: number
  readonly change: number
  readonly changePercent: number
  readonly volume: number
  readonly marketCap: string
}

export interface RankingResult {
  readonly stocks: readonly RankingStock[]
  readonly totalCount: number
}

export async function getRanking(
  type: RankingType,
  market: MarketType,
  page: number = 1,
  pageSize: number = 20
): Promise<RankingResult> {
  const cacheKey = `naver:ranking:${type}:${market}:${page}`
  const cached = cache.get<RankingResult>(cacheKey)
  if (cached) return cached

  try {
    const marketPath = market === "KOSDAQ" ? `/${type}/KOSDAQ` : `/${type}`
    const url = `${NAVER_STOCK_API}/stocks${marketPath}?page=${page}&pageSize=${pageSize}`

    const res = await fetch(url, { headers: HEADERS })
    if (!res.ok) return { stocks: [], totalCount: 0 }

    const data = await res.json()
    const stocks: unknown[] = data?.stocks ?? data ?? []
    const totalCount = typeof data?.totalCount === "number" ? data.totalCount : stocks.length

    const result: RankingResult = {
      stocks: stocks.map((item, i) => {
        const s = item as Record<string, unknown>
        return {
          rank: (page - 1) * pageSize + i + 1,
          ticker: String(s.itemCode ?? s.stockCode ?? s.code ?? ""),
          name: String(s.stockName ?? s.name ?? ""),
          price: parseNum(s.closePrice ?? s.price),
          change: parseNum(s.compareToPreviousClosePrice ?? s.change),
          changePercent: parseFloat(String(s.fluctuationsRatio ?? s.changeRate ?? "0")) || 0,
          volume: parseNum(s.accumulatedTradingVolume ?? s.volume),
          marketCap: String(s.marketValue ?? s.marketCap ?? ""),
        }
      }),
      totalCount,
    }

    cache.set(cacheKey, result, FIVE_MINUTES)
    return result
  } catch (error) {
    console.error(`Failed to fetch ranking ${type}/${market}:`, error)
    return { stocks: [], totalCount: 0 }
  }
}

function parseNum(value: unknown): number {
  if (value === null || value === undefined) return 0
  return Number(String(value).replace(/,/g, "")) || 0
}
