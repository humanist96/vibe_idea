import { NextResponse, type NextRequest } from "next/server"
import { getInsiderActivities } from "@/lib/api/dart-insider"

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const tickers: string[] = body.tickers ?? []

    if (tickers.length === 0) {
      return NextResponse.json({ success: true, data: {} })
    }

    const cutoff = new Date(Date.now() - THIRTY_DAYS_MS)
      .toISOString()
      .slice(0, 10)

    const results = await Promise.allSettled(
      tickers.map(async (ticker) => {
        const activities = await getInsiderActivities(ticker)
        const recent = activities.filter((a) => a.date >= cutoff)
        return { ticker, activities: recent }
      })
    )

    const data: Record<string, unknown[]> = {}
    for (const result of results) {
      if (result.status === "fulfilled") {
        data[result.value.ticker] = result.value.activities
      }
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Watchlist insider API error:", error)
    return NextResponse.json(
      { success: false, error: "내부자 거래 데이터를 불러올 수 없습니다." },
      { status: 500 }
    )
  }
}
