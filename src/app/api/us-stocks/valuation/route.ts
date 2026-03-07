import { NextResponse } from "next/server"
import { getUSMetrics, getUSQuoteBatch } from "@/lib/api/finnhub"
import { getUSStocksBySector, US_SECTORS, SECTOR_MAP } from "@/lib/data/us-stock-registry"
import { cache, ONE_HOUR } from "@/lib/cache/memory-cache"

interface SectorValuation {
  readonly sector: string
  readonly sectorKr: string
  readonly stockCount: number
  readonly avgPE: number | null
  readonly avgPB: number | null
  readonly totalMarketCap: number
  readonly avgDividendYield: number | null
  readonly topStocks: readonly { symbol: string; nameKr: string; marketCap: number }[]
}

export async function GET() {
  const cacheKey = "us-valuation-data"
  const cached = cache.get<readonly SectorValuation[]>(cacheKey)
  if (cached) {
    return NextResponse.json({ success: true, data: cached })
  }

  try {
    const sectorData: SectorValuation[] = []

    for (const sector of US_SECTORS) {
      const stocks = getUSStocksBySector(sector)
      if (stocks.length === 0) continue

      const symbols = stocks.map((s) => s.symbol)
      const quotes = await getUSQuoteBatch(symbols)

      const BATCH_SIZE = 5
      const metricsResults: { symbol: string; pe: number | null; pb: number | null; marketCap: number; divYield: number | null; nameKr: string }[] = []

      for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
        const batch = symbols.slice(i, i + BATCH_SIZE)
        const settled = await Promise.allSettled(
          batch.map(async (sym) => {
            const m = await getUSMetrics(sym)
            const entry = stocks.find((s) => s.symbol === sym)
            return {
              symbol: sym,
              pe: m?.metric?.peAnnual ?? null,
              pb: m?.metric?.pbAnnual ?? null,
              marketCap: m?.metric?.marketCapitalization ?? 0,
              divYield: m?.metric?.dividendYieldIndicatedAnnual ?? null,
              nameKr: entry?.nameKr ?? sym,
            }
          })
        )
        for (const r of settled) {
          if (r.status === "fulfilled") {
            metricsResults.push(r.value)
          }
        }
      }

      const validPE = metricsResults.filter((m) => m.pe !== null && m.pe > 0)
      const validPB = metricsResults.filter((m) => m.pb !== null && m.pb > 0)
      const validDiv = metricsResults.filter((m) => m.divYield !== null && m.divYield > 0)

      const avgPE = validPE.length > 0
        ? validPE.reduce((s, m) => s + m.pe!, 0) / validPE.length
        : null
      const avgPB = validPB.length > 0
        ? validPB.reduce((s, m) => s + m.pb!, 0) / validPB.length
        : null
      const avgDivYield = validDiv.length > 0
        ? validDiv.reduce((s, m) => s + m.divYield!, 0) / validDiv.length
        : null
      const totalMarketCap = metricsResults.reduce((s, m) => s + (m.marketCap as number), 0)

      const topStocks = [...metricsResults]
        .sort((a, b) => (b.marketCap as number) - (a.marketCap as number))
        .slice(0, 3)
        .map((m) => ({ symbol: m.symbol, nameKr: m.nameKr, marketCap: m.marketCap as number }))

      sectorData.push({
        sector,
        sectorKr: SECTOR_MAP[sector] ?? sector,
        stockCount: stocks.length,
        avgPE: avgPE ? Math.round(avgPE * 100) / 100 : null,
        avgPB: avgPB ? Math.round(avgPB * 100) / 100 : null,
        totalMarketCap: Math.round(totalMarketCap),
        avgDividendYield: avgDivYield ? Math.round(avgDivYield * 100) / 100 : null,
        topStocks,
      })
    }

    sectorData.sort((a, b) => b.totalMarketCap - a.totalMarketCap)
    cache.set(cacheKey, sectorData, ONE_HOUR)

    return NextResponse.json({ success: true, data: sectorData })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
