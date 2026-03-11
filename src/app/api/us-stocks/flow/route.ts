import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "../../../../../auth"
import {
  getUSInstitutionalOwnership,
  getUSProfile,
} from "@/lib/api/finnhub"
import { findUSStock } from "@/lib/data/us-stock-registry"

const querySchema = z.object({
  tickers: z
    .string()
    .transform((s) => s.split(",").filter(Boolean))
    .pipe(z.array(z.string().min(1).max(10)).max(20)),
})

interface HolderRow {
  readonly name: string
  readonly shares: number
  readonly change: number
  readonly changePercent: number
  readonly filingDate: string
}

interface TickerHolding {
  readonly ticker: string
  readonly topHolders: readonly HolderRow[]
  readonly totalInstitutional: number
  readonly institutionalPercent: number
}

interface SectorFlow {
  readonly sector: string
  readonly sectorKr: string
  readonly netChange: number
  readonly tickers: readonly string[]
}

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(request.url)
  const parsed = querySchema.safeParse({
    tickers: searchParams.get("tickers") ?? "",
  })

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid tickers parameter" },
      { status: 400 }
    )
  }

  const { tickers } = parsed.data

  if (tickers.length === 0) {
    return NextResponse.json(
      { success: false, error: "At least one ticker is required" },
      { status: 400 }
    )
  }

  try {
    const BATCH_SIZE = 5
    const holdings: TickerHolding[] = []
    const sectorMap = new Map<
      string,
      { netChange: number; tickers: string[]; sectorKr: string }
    >()

    for (let i = 0; i < tickers.length; i += BATCH_SIZE) {
      const batch = tickers.slice(i, i + BATCH_SIZE)
      const settled = await Promise.allSettled(
        batch.map(async (ticker) => {
          const upperTicker = ticker.toUpperCase()
          const [owners, profile] = await Promise.all([
            getUSInstitutionalOwnership(upperTicker),
            getUSProfile(upperTicker),
          ])

          const topHolders: HolderRow[] = owners.slice(0, 10).map((h) => {
            const changePercent =
              h.share > 0 && h.change !== 0
                ? (h.change / (h.share - h.change)) * 100
                : 0
            return {
              name: h.name,
              shares: h.share,
              change: h.change,
              changePercent: Math.round(changePercent * 100) / 100,
              filingDate: h.filingDate,
            }
          })

          const totalInstitutional = owners.reduce(
            (sum, h) => sum + h.share,
            0
          )
          const outstanding = profile?.shareOutstanding ?? 0
          const institutionalPercent =
            outstanding > 0
              ? Math.round(
                  (totalInstitutional / (outstanding * 1_000_000)) * 100 * 100
                ) / 100
              : 0

          const entry = findUSStock(upperTicker)
          const sector = entry?.sector ?? profile?.finnhubIndustry ?? "Other"
          const sectorKr = entry?.sectorKr ?? sector

          const netChange = owners.reduce((sum, h) => sum + h.change, 0)

          const existing = sectorMap.get(sector)
          if (existing) {
            sectorMap.set(sector, {
              netChange: existing.netChange + netChange,
              tickers: [...existing.tickers, upperTicker],
              sectorKr: existing.sectorKr,
            })
          } else {
            sectorMap.set(sector, {
              netChange,
              tickers: [upperTicker],
              sectorKr,
            })
          }

          return {
            ticker: upperTicker,
            topHolders,
            totalInstitutional,
            institutionalPercent,
          }
        })
      )

      for (const result of settled) {
        if (result.status === "fulfilled") {
          holdings.push(result.value)
        }
      }
    }

    const sectorFlow: SectorFlow[] = Array.from(sectorMap.entries())
      .map(([sector, data]) => ({
        sector,
        sectorKr: data.sectorKr,
        netChange: data.netChange,
        tickers: data.tickers,
      }))
      .sort((a, b) => Math.abs(b.netChange) - Math.abs(a.netChange))

    return NextResponse.json({
      success: true,
      data: { holdings, sectorFlow },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
