import { NextResponse } from "next/server"
import { auth } from "../../../../../../auth"
import { prisma } from "@/lib/db/prisma"
import { getQuote } from "@/lib/api/naver-finance"
import { getUSQuoteBatch } from "@/lib/api/finnhub"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const items = await prisma.portfolioItem.findMany({
      where: { userId: session.user.id },
    })

    if (items.length === 0) {
      return NextResponse.json({
        success: true,
        summary: {
          totalValue: 0,
          totalCost: 0,
          totalPnl: 0,
          totalPnlPct: 0,
          dailyPnl: 0,
          dailyPnlPct: 0,
        },
        items: [],
      })
    }

    const krItems = items.filter((i) => i.market === "KR")
    const usItems = items.filter((i) => i.market === "US")

    const quotes: Record<string, { price: number; change: number; changePct: number }> = {}

    const [krResults, usResult] = await Promise.allSettled([
      Promise.allSettled(
        krItems.map(async (item) => {
          const q = await getQuote(item.ticker)
          if (q) {
            quotes[item.ticker] = {
              price: q.price,
              change: q.change,
              changePct: q.changePercent,
            }
          }
        })
      ),
      usItems.length > 0
        ? getUSQuoteBatch(usItems.map((i) => i.ticker)).then((map) => {
            for (const [symbol, q] of map) {
              quotes[symbol] = {
                price: q.c,
                change: q.d,
                changePct: q.dp,
              }
            }
          })
        : Promise.resolve(),
    ])
    void krResults
    void usResult

    let totalValue = 0
    let totalCost = 0
    let dailyPnl = 0

    const enrichedItems = items.map((item) => {
      const quote = quotes[item.ticker]
      const currentPrice = quote?.price ?? item.avgPrice
      const cost = item.quantity * item.avgPrice
      const value = item.quantity * currentPrice
      const unrealizedPnl = value - cost
      const unrealizedPnlPct =
        cost > 0 ? Math.round((unrealizedPnl / cost) * 10000) / 100 : 0
      const itemDailyPnl = item.quantity * (quote?.change ?? 0)

      totalValue += value
      totalCost += cost
      dailyPnl += itemDailyPnl

      return {
        ticker: item.ticker,
        market: item.market,
        name: item.name,
        sectorKr: item.sectorKr,
        quantity: item.quantity,
        avgPrice: item.avgPrice,
        currentPrice,
        unrealizedPnl: Math.round(unrealizedPnl),
        unrealizedPnlPct,
      }
    })

    const totalPnl = totalValue - totalCost
    const totalPnlPct =
      totalCost > 0 ? Math.round((totalPnl / totalCost) * 10000) / 100 : 0
    const dailyPnlPct =
      totalValue > 0
        ? Math.round((dailyPnl / (totalValue - dailyPnl)) * 10000) / 100
        : 0

    return NextResponse.json({
      success: true,
      summary: {
        totalValue: Math.round(totalValue),
        totalCost: Math.round(totalCost),
        totalPnl: Math.round(totalPnl),
        totalPnlPct,
        dailyPnl: Math.round(dailyPnl),
        dailyPnlPct,
      },
      items: enrichedItems,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch portfolio summary"
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
