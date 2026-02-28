import { NextRequest, NextResponse } from "next/server"
import { getInvestorFlow } from "@/lib/api/naver-investor"

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

    const limited = tickers.slice(0, 20)
    const results = await Promise.all(
      limited.map(async (ticker) => {
        const flow = await getInvestorFlow(ticker, 1)
        const latest = flow.entries[0]
        if (!latest) return null
        return {
          ticker,
          foreignNet: latest.foreignNet,
          institutionNet: latest.institutionNet,
          foreignRatio: latest.foreignRatio,
          close: latest.close,
          changePercent: latest.changePercent,
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: results.filter(Boolean),
    })
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch investor data" },
      { status: 500 }
    )
  }
}
