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

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), ms)
    ),
  ])
}

async function processSector(sector: string): Promise<SectorPerformance | null> {
  const screenerResult = getScreenerStocks({
    sector,
    sort: "marketCap",
    order: "desc",
    page: 1,
    limit: 2,
    market: "ALL",
    search: "",
  })

  const topStocks: KrxStockEntry[] = screenerResult.data.slice(0, 2)
  if (topStocks.length === 0) return null

  const historicals = await Promise.allSettled(
    topStocks.map(async (stock: KrxStockEntry) => {
      const hist = await withTimeout(getHistorical(stock.ticker, "3mo"), 8000)
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

    stockReturns.push({ ticker: stock.ticker, name: stock.name, return1m: r1m })
  }

  const return1w = totalReturn1w / count
  const return1m = totalReturn1m / count
  const return3m = totalReturn3m / count
  const return6m = totalReturn6m / count

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
}

export async function getSectorPerformances(): Promise<readonly SectorPerformance[]> {
  const cacheKey = "sector:rotation:performances"
  const cached = cache.get<SectorPerformance[]>(cacheKey)
  if (cached) return cached

  await ensureLoaded()
  const allSectors = getSectors()
  const sectors = allSectors.slice(0, 8)

  // Process in batches of 4 to avoid overwhelming naver API
  const performances: SectorPerformance[] = []
  const BATCH_SIZE = 4

  for (let i = 0; i < sectors.length; i += BATCH_SIZE) {
    const batch = sectors.slice(i, i + BATCH_SIZE)
    const results = await Promise.allSettled(batch.map(processSector))
    for (const r of results) {
      if (r.status === "fulfilled" && r.value) {
        performances.push(r.value)
      }
    }
  }

  performances.sort((a, b) => b.return1m - a.return1m)
  cache.set(cacheKey, performances, ONE_HOUR)
  return performances
}
