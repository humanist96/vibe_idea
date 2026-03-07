import { NextResponse } from "next/server"
import { getTwelveTimeSeries } from "@/lib/api/twelve-data"
import { US_SECTOR_ETFS } from "@/lib/data/us-stock-registry"

function calcReturn(
  values: readonly { close: string }[],
  days: number
): number | null {
  if (values.length < 2) return null
  const latest = Number(values[0].close)
  const idx = Math.min(days, values.length - 1)
  const past = values[idx]
  if (!past) return null
  const pastPrice = Number(past.close)
  if (pastPrice === 0) return null
  return ((latest - pastPrice) / pastPrice) * 100
}

export async function GET() {
  try {
    const results = await Promise.allSettled(
      US_SECTOR_ETFS.map(async (etf) => {
        const ts = await getTwelveTimeSeries(etf.symbol, "1day", 180)
        if (!ts) return null

        const values = ts.values
        return {
          symbol: etf.symbol,
          name: etf.name,
          nameKr: etf.nameKr,
          sector: etf.sector,
          sectorKr: etf.sectorKr,
          price: Number(values[0]?.close ?? 0),
          return1W: calcReturn(values, 5),
          return1M: calcReturn(values, 21),
          return3M: calcReturn(values, 63),
          return6M: calcReturn(values, 126),
        }
      })
    )

    const data = results
      .filter(
        (r): r is PromiseFulfilledResult<NonNullable<{
          symbol: string
          name: string
          nameKr: string
          sector: string
          sectorKr: string
          price: number
          return1W: number | null
          return1M: number | null
          return3M: number | null
          return6M: number | null
        }>> => r.status === "fulfilled" && r.value !== null
      )
      .map((r) => r.value)

    return NextResponse.json({ success: true, data })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
