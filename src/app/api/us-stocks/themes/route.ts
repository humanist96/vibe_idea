import { NextResponse } from "next/server"
import { getUSQuoteBatch } from "@/lib/api/finnhub"
import { US_THEMES } from "@/lib/data/us-theme-registry"
import { findUSStock } from "@/lib/data/us-stock-registry"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const themeId = searchParams.get("id")

  try {
    if (themeId) {
      const theme = US_THEMES.find((t) => t.id === themeId)
      if (!theme) {
        return NextResponse.json(
          { success: false, error: "Theme not found" },
          { status: 404 }
        )
      }

      const quotes = await getUSQuoteBatch(theme.symbols)
      const stocks = theme.symbols
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
          }
        })
        .filter((s): s is NonNullable<typeof s> => s !== null)

      const avgChange =
        stocks.length > 0
          ? stocks.reduce((s, st) => s + st.changePercent, 0) / stocks.length
          : 0

      return NextResponse.json({
        success: true,
        data: {
          ...theme,
          stocks,
          avgChange: Math.round(avgChange * 100) / 100,
        },
      })
    }

    // Return all themes with summary
    const allSymbols = [...new Set(US_THEMES.flatMap((t) => t.symbols))]
    const allQuotes = await getUSQuoteBatch(allSymbols)

    const themes = US_THEMES.map((theme) => {
      const changes = theme.symbols
        .map((s) => allQuotes.get(s)?.dp ?? null)
        .filter((v): v is number => v !== null)

      const avgChange =
        changes.length > 0
          ? changes.reduce((s, c) => s + c, 0) / changes.length
          : 0

      return {
        id: theme.id,
        name: theme.name,
        nameKr: theme.nameKr,
        description: theme.description,
        color: theme.color,
        stockCount: theme.symbols.length,
        avgChange: Math.round(avgChange * 100) / 100,
      }
    })

    return NextResponse.json({ success: true, data: themes })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
