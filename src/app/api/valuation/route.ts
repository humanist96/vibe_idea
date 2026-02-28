import { NextResponse } from "next/server"
import { cache, ONE_HOUR } from "@/lib/cache/memory-cache"
import * as registry from "@/lib/data/stock-registry"
import { getQuote } from "@/lib/api/naver-finance"

interface SectorValuation {
  readonly sector: string
  readonly stockCount: number
  readonly totalMarketCap: number
  readonly avgChangePercent: number
  readonly topStocks: readonly StockValuation[]
}

interface StockValuation {
  readonly ticker: string
  readonly name: string
  readonly marketCap: number
  readonly changePercent: number
  readonly per: number | null
  readonly pbr: number | null
}

export async function GET() {
  const cacheKey = "valuation:sectors"
  const cached = cache.get<SectorValuation[]>(cacheKey)
  if (cached) {
    return NextResponse.json({ success: true, data: cached })
  }

  try {
    await registry.ensureLoaded()
    await registry.ensurePricingFresh()

    const sectors = registry.getSectors()
    const sectorData: SectorValuation[] = []

    for (const sector of sectors) {
      if (!sector || sector === "기타") continue

      const stocks = registry.getScreenerStocks({
        page: 1,
        limit: 5,
        market: "ALL",
        sector,
        sort: "marketCap",
        order: "desc",
        search: "",
      })

      if (stocks.data.length === 0) continue

      const topStocks: StockValuation[] = await Promise.all(
        stocks.data.slice(0, 5).map(async (s) => {
          const quote = await getQuote(s.ticker)
          return {
            ticker: s.ticker,
            name: s.name,
            marketCap: s.marketCap,
            changePercent: s.changePercent,
            per: quote?.per ?? null,
            pbr: quote?.pbr ?? null,
          }
        })
      )

      const totalMarketCap = stocks.data.reduce((sum, s) => sum + s.marketCap, 0)
      const avgChangePercent =
        stocks.data.length > 0
          ? stocks.data.reduce((sum, s) => sum + s.changePercent, 0) / stocks.data.length
          : 0

      sectorData.push({
        sector,
        stockCount: stocks.meta.total,
        totalMarketCap,
        avgChangePercent,
        topStocks,
      })
    }

    const sorted = sectorData.sort((a, b) => b.totalMarketCap - a.totalMarketCap)
    cache.set(cacheKey, sorted, ONE_HOUR)

    return NextResponse.json({ success: true, data: sorted })
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch valuation data" },
      { status: 500 }
    )
  }
}
