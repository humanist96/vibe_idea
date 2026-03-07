import { NextResponse } from "next/server"
import { getUSQuoteBatch, getUSMarketStatus } from "@/lib/api/finnhub"
import { getTopUSStocks, getPopularETFs, US_INDEX_SYMBOLS } from "@/lib/data/us-stock-registry"

export async function GET() {
  try {
    // 지수 ETF 시세 + 시총 상위 종목 시세 병렬 조회
    const topStocks = getTopUSStocks(15)
    const etfs = getPopularETFs()

    const allSymbols = [
      ...US_INDEX_SYMBOLS,
      ...topStocks.map((s) => s.symbol),
    ]

    const [quotesMap, marketStatus] = await Promise.allSettled([
      getUSQuoteBatch(allSymbols),
      getUSMarketStatus(),
    ])

    const quotes = quotesMap.status === "fulfilled" ? quotesMap.value : new Map()
    const status = marketStatus.status === "fulfilled" ? marketStatus.value : null

    // 지수 ETF
    const indices = US_INDEX_SYMBOLS.map((sym) => {
      const q = quotes.get(sym)
      const etf = etfs.find((e) => e.symbol === sym)
      return {
        symbol: sym,
        name: etf?.name ?? sym,
        nameKr: etf?.nameKr ?? sym,
        price: q?.c ?? 0,
        change: q?.d ?? 0,
        changePercent: q?.dp ?? 0,
      }
    })

    // 시총 상위 종목
    const stocks = topStocks.map((stock) => {
      const q = quotes.get(stock.symbol)
      return {
        symbol: stock.symbol,
        name: stock.name,
        nameKr: stock.nameKr,
        sector: stock.sector,
        sectorKr: stock.sectorKr,
        exchange: stock.exchange,
        price: q?.c ?? 0,
        change: q?.d ?? 0,
        changePercent: q?.dp ?? 0,
      }
    }).filter((s) => s.price > 0)

    return NextResponse.json({
      success: true,
      data: {
        indices,
        stocks,
        market: {
          isOpen: status?.isOpen ?? false,
          session: status?.session ?? "",
          timezone: status?.timezone ?? "America/New_York",
        },
      },
    })
  } catch (error) {
    console.error("US Market overview API error:", error)
    return NextResponse.json(
      { success: false, error: "시장 데이터를 불러올 수 없습니다." },
      { status: 500 }
    )
  }
}
