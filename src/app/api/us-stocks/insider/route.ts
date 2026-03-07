import { NextResponse } from "next/server"
import { getInsiderTradings } from "@/lib/api/sec-api"
import { findUSStock } from "@/lib/data/us-stock-registry"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get("symbol")

  if (!symbol) {
    return NextResponse.json(
      { success: false, error: "symbol query parameter is required" },
      { status: 400 }
    )
  }

  try {
    const upperSymbol = symbol.toUpperCase()
    const trades = await getInsiderTradings(upperSymbol)
    const entry = findUSStock(upperSymbol)

    const buys = trades.filter((t) => t.type === "buy")
    const sells = trades.filter((t) => t.type === "sell")

    return NextResponse.json({
      success: true,
      data: {
        symbol: upperSymbol,
        name: entry?.name ?? upperSymbol,
        nameKr: entry?.nameKr ?? upperSymbol,
        transactions: trades.map((t) => ({
          name: t.ownerName,
          title: t.ownerTitle,
          isDirector: t.isDirector,
          isOfficer: t.isOfficer,
          shares: t.shares,
          change: t.acquiredDisposed === "D" ? -t.shares : t.shares,
          filingDate: t.filingDate,
          transactionDate: t.transactionDate,
          transactionCode: t.transactionCode,
          transactionPrice: t.pricePerShare ?? 0,
          sharesAfter: t.sharesAfter,
          securityTitle: t.securityTitle,
          type: t.type,
        })),
        summary: {
          totalTransactions: trades.length,
          buys: buys.length,
          sells: sells.length,
        },
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
