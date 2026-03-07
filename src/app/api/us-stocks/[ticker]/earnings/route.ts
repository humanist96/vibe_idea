import { NextResponse, type NextRequest } from "next/server"
import { getUSEarningsCalendar } from "@/lib/api/finnhub"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await params
    const symbol = ticker.toUpperCase()

    // 과거 1년 + 미래 3개월 범위로 조회
    const now = new Date()
    const from = new Date(now)
    from.setFullYear(from.getFullYear() - 1)
    const to = new Date(now)
    to.setMonth(to.getMonth() + 3)

    const allEvents = await getUSEarningsCalendar(
      from.toISOString().slice(0, 10),
      to.toISOString().slice(0, 10)
    )

    // 해당 심볼만 필터
    const filtered = allEvents
      .filter((e) => e.symbol === symbol)
      .map((e) => ({
        date: e.date,
        hour: e.hour,
        epsEstimate: e.epsEstimate,
        epsActual: e.epsActual,
        revenueEstimate: e.revenueEstimate,
        revenueActual: e.revenueActual,
        quarter: e.quarter,
        year: e.year,
        surprisePercent:
          e.epsActual != null && e.epsEstimate != null && e.epsEstimate !== 0
            ? ((e.epsActual - e.epsEstimate) / Math.abs(e.epsEstimate)) * 100
            : null,
      }))

    return NextResponse.json({ success: true, data: filtered })
  } catch (error) {
    console.error("US Stock earnings API error:", error)
    return NextResponse.json(
      { success: false, error: "실적 데이터를 불러올 수 없습니다." },
      { status: 500 }
    )
  }
}
