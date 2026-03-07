import { NextResponse } from "next/server"
import { getUSQuoteBatch } from "@/lib/api/finnhub"
import { getAllUSStocks, findUSStock } from "@/lib/data/us-stock-registry"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type") ?? "up"

  if (type !== "up" && type !== "down") {
    return NextResponse.json(
      { success: false, error: "type must be 'up' or 'down'" },
      { status: 400 }
    )
  }

  try {
    const stocks = getAllUSStocks()
    const symbols = stocks.map((s) => s.symbol)
    const quotes = await getUSQuoteBatch(symbols)

    const ranked = symbols
      .map((symbol) => {
        const quote = quotes.get(symbol)
        const entry = findUSStock(symbol)
        if (!quote || !entry) return null
        return {
          symbol,
          name: entry.name,
          nameKr: entry.nameKr,
          price: quote.c,
          change: quote.d,
          changePercent: quote.dp,
          sector: entry.sector,
          sectorKr: entry.sectorKr,
          exchange: entry.exchange,
        }
      })
      .filter((s): s is NonNullable<typeof s> => s !== null && s.price > 0)
      .sort((a, b) =>
        type === "up"
          ? b.changePercent - a.changePercent
          : a.changePercent - b.changePercent
      )
      .map((s, i) => ({ ...s, rank: i + 1 }))

    return NextResponse.json({ success: true, data: ranked })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
