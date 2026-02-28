import { NextRequest, NextResponse } from "next/server"
import { getBatchBlockHoldings } from "@/lib/api/dart-block-holdings"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const tickers = body.tickers as string[]

    if (!Array.isArray(tickers) || tickers.length === 0) {
      return NextResponse.json(
        { success: false, error: "tickers array required" },
        { status: 400 }
      )
    }

    const limited = tickers.slice(0, 30)
    const data = await getBatchBlockHoldings(limited)

    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch block holdings" },
      { status: 500 }
    )
  }
}
