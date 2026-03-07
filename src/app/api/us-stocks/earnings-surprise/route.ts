import { NextResponse } from "next/server"
import { getUSEarningsCalendar } from "@/lib/api/finnhub"
import { findUSStock } from "@/lib/data/us-stock-registry"

export async function GET() {
  try {
    const today = new Date()
    const past = new Date(today)
    past.setDate(past.getDate() - 30)
    const future = new Date(today)
    future.setDate(future.getDate() + 14)

    const events = await getUSEarningsCalendar(
      past.toISOString().slice(0, 10),
      future.toISOString().slice(0, 10)
    )

    const todayStr = today.toISOString().slice(0, 10)

    const reported = events
      .filter(
        (e) =>
          e.epsActual !== null &&
          e.epsEstimate !== null &&
          e.date <= todayStr
      )
      .map((e) => {
        const surprise =
          e.epsEstimate !== null && e.epsEstimate !== 0
            ? ((e.epsActual! - e.epsEstimate) / Math.abs(e.epsEstimate)) * 100
            : 0

        const entry = findUSStock(e.symbol)
        return {
          symbol: e.symbol,
          name: entry?.name ?? e.symbol,
          nameKr: entry?.nameKr ?? e.symbol,
          date: e.date,
          quarter: `${e.year} Q${e.quarter}`,
          epsActual: e.epsActual,
          epsEstimate: e.epsEstimate,
          revenueActual: e.revenueActual,
          revenueEstimate: e.revenueEstimate,
          surprisePercent: Math.round(surprise * 100) / 100,
          verdict:
            surprise > 2
              ? ("beat" as const)
              : surprise < -2
                ? ("miss" as const)
                : ("inline" as const),
          hour: e.hour,
        }
      })
      .sort((a, b) => b.date.localeCompare(a.date))

    const upcoming = events
      .filter((e) => e.date > todayStr)
      .map((e) => {
        const entry = findUSStock(e.symbol)
        return {
          symbol: e.symbol,
          name: entry?.name ?? e.symbol,
          nameKr: entry?.nameKr ?? e.symbol,
          date: e.date,
          quarter: `${e.year} Q${e.quarter}`,
          epsEstimate: e.epsEstimate,
          revenueEstimate: e.revenueEstimate,
          hour: e.hour,
        }
      })
      .sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({
      success: true,
      data: { reported, upcoming },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
