import { NextResponse } from "next/server"
import { getUSEarningsCalendar } from "@/lib/api/finnhub"
import { findUSStock } from "@/lib/data/us-stock-registry"

export async function GET() {
  try {
    const events = await getUSEarningsCalendar()

    const data = events
      .filter((e) => e.symbol && !e.symbol.includes("."))
      .slice(0, 50)
      .map((e) => {
        const registry = findUSStock(e.symbol)
        return {
          symbol: e.symbol,
          name: registry?.name ?? e.symbol,
          nameKr: registry?.nameKr ?? null,
          date: e.date,
          hour: e.hour,
          epsEstimate: e.epsEstimate,
          epsActual: e.epsActual,
          revenueEstimate: e.revenueEstimate,
          revenueActual: e.revenueActual,
          quarter: e.quarter,
          year: e.year,
        }
      })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Earnings calendar API error:", error)
    return NextResponse.json(
      { success: false, error: "실적 캘린더를 불러올 수 없습니다." },
      { status: 500 }
    )
  }
}
