import { NextResponse, type NextRequest } from "next/server"
import {
  ensureLoaded,
  ensurePricingFresh,
  getScreenerStocks,
  getTopStocksFromRegistry,
} from "@/lib/data/stock-registry"
import type { KrxStockEntry, ScreenerParams } from "@/lib/data/krx-types"

function enrichEntry(entry: KrxStockEntry) {
  return {
    ...entry,
    per: null as number | null,
    pbr: null as number | null,
    eps: null as number | null,
    dividendYield: null as number | null,
    foreignRate: null as number | null,
    previousClose: 0,
    dayHigh: 0,
    dayLow: 0,
    fiftyTwoWeekHigh: 0,
    fiftyTwoWeekLow: 0,
    aiScore: null as number | null,
  }
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
      const stocks = getTopStocksFromRegistry(50).map(enrichEntry)
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
    return NextResponse.json({
      success: true,
      data: result.data.map(enrichEntry),
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
