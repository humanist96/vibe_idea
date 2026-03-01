import { NextResponse, type NextRequest } from "next/server"
import {
  ensureLoaded,
  ensurePricingFresh,
  getScreenerStocks,
  getTopStocksFromRegistry,
} from "@/lib/data/stock-registry"
import type { KrxStockEntry, ScreenerParams } from "@/lib/data/krx-types"
import { getQuote } from "@/lib/api/naver-finance"

interface EnrichedEntry extends KrxStockEntry {
  readonly per: number | null
  readonly pbr: number | null
  readonly eps: number | null
  readonly dividendYield: number | null
  readonly foreignRate: number | null
}

async function enrichEntries(entries: readonly KrxStockEntry[]): Promise<EnrichedEntry[]> {
  const quotes = await Promise.all(
    entries.map((e) => getQuote(e.ticker).catch(() => null))
  )

  return entries.map((entry, i) => {
    const q = quotes[i]
    return {
      ...entry,
      per: q?.per ?? null,
      pbr: q?.pbr ?? null,
      eps: q?.eps ?? null,
      dividendYield: q?.dividendYield ?? null,
      foreignRate: q?.foreignRate ?? null,
    }
  })
}

function parseOptionalNumber(value: string | null): number | undefined {
  if (!value) return undefined
  const n = Number(value)
  return isNaN(n) ? undefined : n
}

interface Tier2Filters {
  readonly minPer?: number
  readonly maxPer?: number
  readonly minPbr?: number
  readonly maxPbr?: number
  readonly minDividendYield?: number
  readonly maxDividendYield?: number
  readonly minForeignRate?: number
}

function hasTier2Filters(t2: Tier2Filters): boolean {
  return (
    t2.minPer !== undefined ||
    t2.maxPer !== undefined ||
    t2.minPbr !== undefined ||
    t2.maxPbr !== undefined ||
    t2.minDividendYield !== undefined ||
    t2.maxDividendYield !== undefined ||
    t2.minForeignRate !== undefined
  )
}

function applyTier2(stocks: EnrichedEntry[], t2: Tier2Filters): EnrichedEntry[] {
  return stocks.filter((s) => {
    if (t2.minPer !== undefined && (s.per === null || s.per < t2.minPer)) return false
    if (t2.maxPer !== undefined && (s.per === null || s.per > t2.maxPer)) return false
    if (t2.minPbr !== undefined && (s.pbr === null || s.pbr < t2.minPbr)) return false
    if (t2.maxPbr !== undefined && (s.pbr === null || s.pbr > t2.maxPbr)) return false
    if (t2.minDividendYield !== undefined && (s.dividendYield === null || s.dividendYield < t2.minDividendYield)) return false
    if (t2.maxDividendYield !== undefined && (s.dividendYield === null || s.dividendYield > t2.maxDividendYield)) return false
    if (t2.minForeignRate !== undefined && (s.foreignRate === null || s.foreignRate < t2.minForeignRate)) return false
    return true
  })
}

export async function GET(request: NextRequest) {
  try {
    await ensureLoaded()
    await ensurePricingFresh()

    const sp = request.nextUrl.searchParams

    const hasParams =
      sp.has("page") ||
      sp.has("market") ||
      sp.has("sector") ||
      sp.has("sort") ||
      sp.has("search")

    if (!hasParams) {
      const raw = getTopStocksFromRegistry(50)
      const stocks = await enrichEntries(raw)
      return NextResponse.json({
        success: true,
        data: stocks,
        meta: {
          total: stocks.length,
          page: 1,
          limit: stocks.length,
          totalPages: 1,
        },
      })
    }

    const tier2: Tier2Filters = {
      minPer: parseOptionalNumber(sp.get("minPer")),
      maxPer: parseOptionalNumber(sp.get("maxPer")),
      minPbr: parseOptionalNumber(sp.get("minPbr")),
      maxPbr: parseOptionalNumber(sp.get("maxPbr")),
      minDividendYield: parseOptionalNumber(sp.get("minDividendYield")),
      maxDividendYield: parseOptionalNumber(sp.get("maxDividendYield")),
      minForeignRate: parseOptionalNumber(sp.get("minForeignRate")),
    }

    const requestedLimit = Math.min(100, Math.max(1, Number(sp.get("limit")) || 50))
    const useTier2 = hasTier2Filters(tier2)
    const fetchLimit = useTier2 ? requestedLimit * 3 : requestedLimit

    const params: ScreenerParams = {
      page: Math.max(1, Number(sp.get("page")) || 1),
      limit: fetchLimit,
      market: (sp.get("market") as "ALL" | "KOSPI" | "KOSDAQ") || "ALL",
      sector: sp.get("sector") ?? "",
      sort: sp.get("sort") ?? "marketCap",
      order: (sp.get("order") as "asc" | "desc") || "desc",
      search: sp.get("search") ?? "",
      minPrice: parseOptionalNumber(sp.get("minPrice")),
      maxPrice: parseOptionalNumber(sp.get("maxPrice")),
      minChangePercent: parseOptionalNumber(sp.get("minChangePercent")),
      maxChangePercent: parseOptionalNumber(sp.get("maxChangePercent")),
      minMarketCap: parseOptionalNumber(sp.get("minMarketCap")),
      maxMarketCap: parseOptionalNumber(sp.get("maxMarketCap")),
    }

    if (useTier2) {
      const overFetchParams = { ...params, page: 1, limit: fetchLimit }
      const result = getScreenerStocks(overFetchParams)
      const enriched = await enrichEntries(result.data)
      const filtered = applyTier2(enriched, tier2)
      const total = filtered.length
      const totalPages = Math.max(1, Math.ceil(total / requestedLimit))
      const requestedPage = Math.max(1, Number(sp.get("page")) || 1)
      const page = Math.min(requestedPage, totalPages)
      const start = (page - 1) * requestedLimit
      const sliced = filtered.slice(start, start + requestedLimit)

      return NextResponse.json({
        success: true,
        data: sliced,
        meta: { total, page, limit: requestedLimit, totalPages },
      })
    }

    const result = getScreenerStocks(params)
    const stocks = await enrichEntries(result.data)

    return NextResponse.json({
      success: true,
      data: stocks,
      meta: result.meta,
    })
  } catch (error) {
    console.error("Stocks API error:", error)
    return NextResponse.json(
      { success: false, error: "종목 데이터를 불러올 수 없습니다." },
      { status: 500 }
    )
  }
}
