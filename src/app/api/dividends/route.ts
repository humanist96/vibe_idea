import { NextRequest, NextResponse } from "next/server"
import { getBatchDividendInfo } from "@/lib/api/dart-dividend"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const tickers = body.tickers as string[]
    const year = body.year as number | undefined

    if (!Array.isArray(tickers) || tickers.length === 0) {
      return NextResponse.json(
        { success: false, error: "tickers array required" },
        { status: 400 }
      )
    }

    const limited = tickers.slice(0, 30)
    const data = await getBatchDividendInfo(limited, year)

    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch dividend data" },
      { status: 500 }
    )
  }
}
