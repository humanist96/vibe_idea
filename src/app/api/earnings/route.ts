import { NextResponse } from "next/server"
import { getFinanceQuarter } from "@/lib/api/naver-finance-detail"
import { analyzeEarningsSurprise } from "@/lib/analysis/earnings-surprise"
import { cache, FIVE_MINUTES } from "@/lib/cache/memory-cache"
import {
  ensureLoaded,
  getTopStocksFromRegistry,
} from "@/lib/data/stock-registry"

interface EarningsRank {
  readonly ticker: string
  readonly name: string
  readonly quarter: string
  readonly surprisePercent: number
  readonly verdict: "beat" | "inline" | "miss"
  readonly metric: string
  readonly actual: number
  readonly consensus: number
}

export async function GET() {
  const cacheKey = "earnings:surprise:top"
  const cached = cache.get<EarningsRank[]>(cacheKey)
  if (cached) {
    return NextResponse.json({ success: true, data: cached })
  }

  try {
    await ensureLoaded()
    const topStocks = getTopStocksFromRegistry(50)

    const results = await Promise.allSettled(
      topStocks.map(async (stock) => {
        const quarterData = await getFinanceQuarter(stock.ticker)
        const result = analyzeEarningsSurprise(quarterData, stock.ticker)
        if (!result.latestVerdict || result.surprises.length === 0) return null

        const primary =
          result.surprises.find((s) => s.metric.includes("영업이익")) ??
          result.surprises[0]

        return {
          ticker: stock.ticker,
          name: stock.name,
          quarter: primary.quarter,
          surprisePercent: primary.surprisePercent,
          verdict: primary.verdict,
          metric: primary.metric,
          actual: primary.actual,
          consensus: primary.consensus,
        } as EarningsRank
      })
    )

    const ranked = results
      .map((r) => (r.status === "fulfilled" ? r.value : null))
      .filter((r): r is EarningsRank => r !== null)
      .sort((a, b) => Math.abs(b.surprisePercent) - Math.abs(a.surprisePercent))

    cache.set(cacheKey, ranked, FIVE_MINUTES)
    return NextResponse.json({ success: true, data: ranked })
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch earnings data" },
      { status: 500 }
    )
  }
}
