import { NextResponse } from "next/server"
import { getTwelveDividends } from "@/lib/api/twelve-data"
import { getUSMetrics } from "@/lib/api/finnhub"
import { findUSStock } from "@/lib/data/us-stock-registry"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const symbols: string[] = body.symbols ?? body.tickers ?? []

    if (symbols.length === 0) {
      return NextResponse.json(
        { success: false, error: "symbols required" },
        { status: 400 }
      )
    }

    const results = await Promise.allSettled(
      symbols.slice(0, 20).map(async (symbol) => {
        const [dividends, metrics] = await Promise.allSettled([
          getTwelveDividends(symbol),
          getUSMetrics(symbol),
        ])

        const entry = findUSStock(symbol)
        const divData =
          dividends.status === "fulfilled" ? dividends.value : null
        const metricData =
          metrics.status === "fulfilled" ? metrics.value : null

        const history = divData?.dividends ?? []
        const annualYield =
          metricData?.metric?.dividendYieldIndicatedAnnual ?? null
        const annualDiv =
          metricData?.metric?.dividendPerShareAnnual ?? null

        return {
          symbol,
          name: entry?.name ?? symbol,
          nameKr: entry?.nameKr ?? symbol,
          sector: entry?.sector ?? "",
          dividendYield: annualYield,
          dividendPerShare: annualDiv,
          history: history.slice(0, 20).map((d) => ({
            exDate: d.ex_date,
            amount: d.amount,
          })),
        }
      })
    )

    const data = results
      .filter(
        (r): r is PromiseFulfilledResult<{
          symbol: string
          name: string
          nameKr: string
          sector: string
          dividendYield: number | null
          dividendPerShare: number | null
          history: { exDate: string; amount: number }[]
        }> => r.status === "fulfilled"
      )
      .map((r) => r.value)
      .sort((a, b) => (b.dividendYield ?? 0) - (a.dividendYield ?? 0))

    return NextResponse.json({ success: true, data })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
