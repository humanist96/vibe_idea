import { getHistorical } from "@/lib/api/naver-finance"
import type { HistoricalData } from "@/lib/api/naver-finance"
import {
  ensureLoaded,
  getScreenerStocks,
  getSectors,
} from "@/lib/data/stock-registry"
import type { KrxStockEntry } from "@/lib/data/krx-types"
import { cache, ONE_HOUR } from "@/lib/cache/memory-cache"

export interface SectorPerformance {
  readonly sector: string
  readonly return1w: number
  readonly return1m: number
  readonly return3m: number
  readonly return6m: number
  readonly momentum: "accelerating" | "decelerating" | "stable"
  readonly stocks: readonly {
    readonly ticker: string
    readonly name: string
    readonly return1m: number
  }[]
}

function calculateReturn(
  data: readonly { readonly close: number; readonly date: string }[],
  days: number
): number {
  if (data.length < 2) return 0
  const latest = data[data.length - 1]
  const targetIdx = Math.max(0, data.length - 1 - days)
  const target = data[targetIdx]
  if (!target || target.close === 0) return 0
  return ((latest.close - target.close) / target.close) * 100
}

export async function getSectorPerformances(): Promise<readonly SectorPerformance[]> {
  const cacheKey = "sector:rotation:performances"
  const cached = cache.get<SectorPerformance[]>(cacheKey)
  if (cached) return cached

  await ensureLoaded()
  const allSectors = getSectors()
  // Limit to top 10 sectors to avoid API timeout on serverless
  const sectors = allSectors.slice(0, 10)

  const sectorResults = await Promise.allSettled(
    sectors.map(async (sector) => {
      const screenerResult = getScreenerStocks({
        sector,
        sort: "marketCap",
        order: "desc",
        page: 1,
        limit: 3,
        market: "ALL",
        search: "",
      })

      const topStocks: KrxStockEntry[] = screenerResult.data.slice(0, 3)
      if (topStocks.length === 0) return null

      const historicals = await Promise.allSettled(
        topStocks.map(async (stock: KrxStockEntry) => {
          const hist = await getHistorical(stock.ticker, "3mo")
          return { ticker: stock.ticker, name: stock.name, data: hist }
        })
      )

      const validStocks = historicals
        .filter(
          (r): r is PromiseFulfilledResult<{
            ticker: string
            name: string
            data: HistoricalData[]
          }> => r.status === "fulfilled" && r.value.data.length > 0
        )
        .map((r) => r.value)

      if (validStocks.length === 0) return null

      // Calculate weighted average returns
      let totalReturn1w = 0
      let totalReturn1m = 0
      let totalReturn3m = 0
      let totalReturn6m = 0
      const count = validStocks.length

      const stockReturns: { ticker: string; name: string; return1m: number }[] = []

      for (const stock of validStocks) {
        const r1w = calculateReturn(stock.data, 5)
        const r1m = calculateReturn(stock.data, 22)
        const r3m = calculateReturn(stock.data, 66)
        const r6m = calculateReturn(stock.data, 132)

        totalReturn1w += r1w
        totalReturn1m += r1m
        totalReturn3m += r3m
        totalReturn6m += r6m

        stockReturns.push({
          ticker: stock.ticker,
          name: stock.name,
          return1m: r1m,
        })
      }

      const return1w = totalReturn1w / count
      const return1m = totalReturn1m / count
      const return3m = totalReturn3m / count
      const return6m = totalReturn6m / count

      // Momentum: compare annualized 1M vs 3M
      const annualized1m = return1m * 12
      const annualized3m = return3m * 4
      let momentum: "accelerating" | "decelerating" | "stable" = "stable"
      if (annualized1m > annualized3m + 5) momentum = "accelerating"
      else if (annualized1m < annualized3m - 5) momentum = "decelerating"

      return {
        sector,
        return1w,
        return1m,
        return3m,
        return6m,
        momentum,
        stocks: stockReturns,
      } as SectorPerformance
    })
  )

  const performances = sectorResults
    .map((r) => (r.status === "fulfilled" ? r.value : null))
    .filter((r): r is SectorPerformance => r !== null)
    .sort((a, b) => b.return1m - a.return1m)

  cache.set(cacheKey, performances, ONE_HOUR)
  return performances
}
