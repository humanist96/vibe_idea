import { NextRequest, NextResponse } from "next/server"
import { getQuote } from "@/lib/api/naver-finance"
import { getFearGreedIndex } from "@/lib/api/fear-greed"
import { getMarketIndices } from "@/lib/api/naver-finance"
import { getFinanceQuarter } from "@/lib/api/naver-finance-detail"
import { findStock } from "@/lib/constants/stocks"

interface PriceAlert {
  readonly ticker: string
  readonly name: string
  readonly price: number
  readonly changePercent: number
}

interface MarketAlert {
  readonly type: "fear_greed" | "index"
  readonly message: string
  readonly value: number
}

interface EarningsAlert {
  readonly ticker: string
  readonly name: string
  readonly quarter: string
  readonly dDay: number
}

interface AlertsResponse {
  readonly priceAlerts: PriceAlert[]
  readonly marketAlerts: MarketAlert[]
  readonly earningsAlerts: EarningsAlert[]
}

const PRICE_THRESHOLD = 3
const INDEX_THRESHOLD = 2
const FEAR_GREED_LOW = 20
const FEAR_GREED_HIGH = 80
const EARNINGS_D_DAY_LIMIT = 3

function estimateAnnouncementDate(quarterTitle: string): Date | null {
  // Quarter titles look like "2025.03." or "2024.12.(E)"
  const match = quarterTitle.match(/(\d{4})\.(\d{2})\./)
  if (!match) return null

  const year = parseInt(match[1], 10)
  const month = parseInt(match[2], 10)

  // Korean companies typically report ~45 days after quarter end
  const quarterEnd = new Date(year, month, 0) // last day of the quarter month
  const estimated = new Date(quarterEnd.getTime() + 45 * 24 * 60 * 60 * 1000)
  return estimated
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const tickers: string[] = body.tickers ?? []

    if (tickers.length === 0) {
      return NextResponse.json({
        success: true,
        data: { priceAlerts: [], marketAlerts: [], earningsAlerts: [] },
      })
    }

    // Fetch all data in parallel
    const [quoteResults, fearGreed, indices, ...earningsResults] =
      await Promise.all([
        Promise.allSettled(tickers.map((t) => getQuote(t))),
        getFearGreedIndex(),
        getMarketIndices(),
        ...tickers.map((t) => getFinanceQuarter(t)),
      ])

    // --- Price alerts: ±3% ---
    const priceAlerts: PriceAlert[] = []
    const quoteSettled = quoteResults as PromiseSettledResult<Awaited<ReturnType<typeof getQuote>>>[]

    for (const result of quoteSettled) {
      if (result.status !== "fulfilled" || !result.value) continue
      const q = result.value
      if (Math.abs(q.changePercent) >= PRICE_THRESHOLD) {
        const stock = findStock(q.ticker)
        priceAlerts.push({
          ticker: q.ticker,
          name: stock?.name ?? q.name,
          price: q.price,
          changePercent: q.changePercent,
        })
      }
    }

    // --- Market alerts: fear/greed extremes + index ±2% ---
    const marketAlerts: MarketAlert[] = []

    if (fearGreed.score <= FEAR_GREED_LOW) {
      marketAlerts.push({
        type: "fear_greed",
        message: `공포탐욕지수 ${fearGreed.score} — ${fearGreed.label}`,
        value: fearGreed.score,
      })
    } else if (fearGreed.score >= FEAR_GREED_HIGH) {
      marketAlerts.push({
        type: "fear_greed",
        message: `공포탐욕지수 ${fearGreed.score} — ${fearGreed.label}`,
        value: fearGreed.score,
      })
    }

    for (const idx of indices) {
      if (Math.abs(idx.changePercent) >= INDEX_THRESHOLD) {
        const direction = idx.changePercent > 0 ? "급등" : "급락"
        marketAlerts.push({
          type: "index",
          message: `${idx.name} ${direction} ${idx.changePercent > 0 ? "+" : ""}${idx.changePercent.toFixed(2)}%`,
          value: idx.changePercent,
        })
      }
    }

    // --- Earnings alerts: D-3 within estimated announcement ---
    const earningsAlerts: EarningsAlert[] = []
    const now = new Date()

    for (let i = 0; i < tickers.length; i++) {
      const financeData = earningsResults[i] as Awaited<ReturnType<typeof getFinanceQuarter>> | undefined
      if (!financeData || financeData.columns.length === 0) continue

      // Find the first consensus column (upcoming quarter)
      const consensusCol = financeData.columns.find((c) => c.isConsensus)
      if (!consensusCol) continue

      const estimated = estimateAnnouncementDate(consensusCol.title)
      if (!estimated) continue

      const diffMs = estimated.getTime() - now.getTime()
      const dDay = Math.ceil(diffMs / (24 * 60 * 60 * 1000))

      if (dDay >= 0 && dDay <= EARNINGS_D_DAY_LIMIT) {
        const stock = findStock(tickers[i])
        earningsAlerts.push({
          ticker: tickers[i],
          name: stock?.name ?? tickers[i],
          quarter: consensusCol.title.replace("(E)", "").trim(),
          dDay,
        })
      }
    }

    const data: AlertsResponse = { priceAlerts, marketAlerts, earningsAlerts }
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Alerts watchlist error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch alerts" },
      { status: 500 }
    )
  }
}
