import { NextRequest, NextResponse } from "next/server"
import { cache, ONE_HOUR } from "@/lib/cache/memory-cache"
import { getAllDividendStocks } from "@/lib/dividend/dividend-data"
import type {
  DividendCalendarEvent,
  DividendMarket,
} from "@/lib/dividend/dividend-types"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const month = searchParams.get("month") // YYYY-MM
    const rawMarket = searchParams.get("market") ?? "ALL"
    const market: DividendMarket | "ALL" =
      rawMarket === "KR" || rawMarket === "US" ? rawMarket : "ALL"

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { success: false, error: "month parameter required (YYYY-MM)" },
        { status: 400 }
      )
    }

    const cacheKey = `dividend-lab:calendar:${month}:${market}`
    const cached = cache.get<readonly DividendCalendarEvent[]>(cacheKey)
    if (cached) {
      return NextResponse.json({ success: true, data: cached })
    }

    const [yearStr, monthStr] = month.split("-")
    const targetMonth = parseInt(monthStr, 10)
    const targetYear = parseInt(yearStr, 10)

    const stocks = await getAllDividendStocks(market)

    const events: DividendCalendarEvent[] = []

    for (const stock of stocks) {
      // 배당 지급월에 해당하는 종목
      if (stock.paymentMonths.includes(targetMonth)) {
        events.push({
          ticker: stock.ticker,
          name: stock.name,
          nameKr: stock.nameKr,
          market: stock.market,
          eventType: "payment",
          date: `${targetYear}-${monthStr}-15`, // 정확한 일자 없으면 월 중순으로 표시
          amount: stock.dividendPerShare,
        })
      }

      // ex-dividend date가 해당 월인 경우
      if (stock.exDividendDate) {
        const exDate = new Date(stock.exDividendDate)
        if (
          exDate.getFullYear() === targetYear &&
          exDate.getMonth() + 1 === targetMonth
        ) {
          events.push({
            ticker: stock.ticker,
            name: stock.name,
            nameKr: stock.nameKr,
            market: stock.market,
            eventType: "ex-date",
            date: stock.exDividendDate,
            amount: stock.dividendPerShare,
          })
        }
      }
    }

    // 날짜순 정렬
    const sorted = [...events].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    cache.set(cacheKey, sorted, ONE_HOUR)
    return NextResponse.json({ success: true, data: sorted })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
