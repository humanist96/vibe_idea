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

    const params: ScreenerParams = {
      page: Math.max(1, Number(sp.get("page")) || 1),
      limit: Math.min(100, Math.max(1, Number(sp.get("limit")) || 50)),
      market: (sp.get("market") as "ALL" | "KOSPI" | "KOSDAQ") || "ALL",
      sector: sp.get("sector") ?? "",
      sort: sp.get("sort") ?? "marketCap",
      order: (sp.get("order") as "asc" | "desc") || "desc",
      search: sp.get("search") ?? "",
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
