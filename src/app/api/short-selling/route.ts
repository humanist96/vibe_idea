import { NextResponse } from "next/server"
import { getShortSelling } from "@/lib/api/naver-short-selling"
import { cache, FIVE_MINUTES } from "@/lib/cache/memory-cache"
import {
  ensureLoaded,
  getTopStocksFromRegistry,
} from "@/lib/data/stock-registry"

interface ShortSellingRank {
  readonly ticker: string
  readonly name: string
  readonly close: number
  readonly shortVolume: number
  readonly shortRatio: number
}

export async function GET() {
  const cacheKey = "short-selling:top"
  const cached = cache.get<ShortSellingRank[]>(cacheKey)
  if (cached) {
    return NextResponse.json({ success: true, data: cached })
  }

  try {
    await ensureLoaded()
    const topStocks = getTopStocksFromRegistry(30)

    const results = await Promise.allSettled(
      topStocks.map(async (stock) => {
        const data = await getShortSelling(stock.ticker, 1)
        const latest = data.entries[0]
        if (!latest) return null
        return {
          ticker: stock.ticker,
          name: stock.name,
          close: latest.close,
          shortVolume: latest.shortVolume,
          shortRatio: latest.shortRatio,
        } as ShortSellingRank
      })
    )

    const ranked = results
      .map((r) => (r.status === "fulfilled" ? r.value : null))
      .filter((r): r is ShortSellingRank => r !== null && r.shortRatio > 0)
      .sort((a, b) => b.shortRatio - a.shortRatio)

    cache.set(cacheKey, ranked, FIVE_MINUTES)
    return NextResponse.json({ success: true, data: ranked })
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch short selling rankings" },
      { status: 500 }
    )
  }
}
