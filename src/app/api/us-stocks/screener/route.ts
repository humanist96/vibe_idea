import { NextResponse } from "next/server"
import { getUSQuoteBatch, getUSMetrics } from "@/lib/api/finnhub"
import { getAllUSStocks, findUSStock, US_SECTORS } from "@/lib/data/us-stock-registry"
import { cache, ONE_HOUR } from "@/lib/cache/memory-cache"

interface ScreenerStock {
  symbol: string
  name: string
  nameKr: string
  sector: string
  sectorKr: string
  exchange: string
  price: number
  changePercent: number
  marketCap: number | null
  pe: number | null
  pb: number | null
  dividendYield: number | null
  beta: number | null
  roe: number | null
  [key: string]: string | number | null
}

async function getScreenerData(): Promise<ScreenerStock[]> {
  const cacheKey = "us-screener-data"
  const cached = cache.get<ScreenerStock[]>(cacheKey)
  if (cached) return cached

  const stocks = getAllUSStocks()
  const symbols = stocks.map((s) => s.symbol)
  const quotes = await getUSQuoteBatch(symbols)

  const BATCH_SIZE = 5
  const metricsMap = new Map<string, Awaited<ReturnType<typeof getUSMetrics>>>()

  for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
    const batch = symbols.slice(i, i + BATCH_SIZE)
    const results = await Promise.allSettled(
      batch.map(async (sym) => ({
        sym,
        data: await getUSMetrics(sym),
      }))
    )
    for (const r of results) {
      if (r.status === "fulfilled" && r.value.data) {
        metricsMap.set(r.value.sym, r.value.data)
      }
    }
  }

  const result: ScreenerStock[] = symbols
    .map((symbol) => {
      const quote = quotes.get(symbol)
      const entry = findUSStock(symbol)
      const metrics = metricsMap.get(symbol)
      if (!quote || !entry) return null

      return {
        symbol,
        name: entry.name,
        nameKr: entry.nameKr,
        sector: entry.sector,
        sectorKr: entry.sectorKr,
        exchange: entry.exchange as string,
        price: quote.c,
        changePercent: quote.dp,
        marketCap: metrics?.metric?.marketCapitalization ?? null,
        pe: metrics?.metric?.peAnnual ?? null,
        pb: metrics?.metric?.pbAnnual ?? null,
        dividendYield: metrics?.metric?.dividendYieldIndicatedAnnual ?? null,
        beta: metrics?.metric?.beta ?? null,
        roe: metrics?.metric?.roeTTM ?? null,
      } as ScreenerStock
    })
    .filter((s): s is ScreenerStock => s !== null)

  cache.set(cacheKey, result, ONE_HOUR)
  return result
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sector = searchParams.get("sector")
  const minPe = searchParams.get("minPe") ? Number(searchParams.get("minPe")) : null
  const maxPe = searchParams.get("maxPe") ? Number(searchParams.get("maxPe")) : null
  const minDivYield = searchParams.get("minDivYield")
    ? Number(searchParams.get("minDivYield"))
    : null
  const sortBy = searchParams.get("sortBy") ?? "marketCap"
  const sortDir = searchParams.get("sortDir") ?? "desc"

  try {
    let data = await getScreenerData()

    if (sector && US_SECTORS.includes(sector)) {
      data = data.filter((s) => s.sector === sector)
    }
    if (minPe !== null) {
      data = data.filter((s) => s.pe !== null && s.pe >= minPe)
    }
    if (maxPe !== null) {
      data = data.filter((s) => s.pe !== null && s.pe <= maxPe)
    }
    if (minDivYield !== null) {
      data = data.filter(
        (s) => s.dividendYield !== null && s.dividendYield >= minDivYield
      )
    }

    const sorted = [...data].sort((a, b) => {
      const aVal = a[sortBy] as number | null
      const bVal = b[sortBy] as number | null
      const av = aVal ?? 0
      const bv = bVal ?? 0
      return sortDir === "asc" ? av - bv : bv - av
    })

    return NextResponse.json({
      success: true,
      data: sorted,
      meta: { total: sorted.length, sectors: US_SECTORS },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
