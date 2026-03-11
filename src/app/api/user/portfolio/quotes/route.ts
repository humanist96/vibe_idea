import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "../../../../../../auth"
import { getQuote } from "@/lib/api/naver-finance"
import { getUSQuoteBatch } from "@/lib/api/finnhub"

const schema = z.object({
  items: z.array(
    z.object({
      ticker: z.string().min(1),
      market: z.enum(["KR", "US"]),
    })
  ),
})

export interface QuoteResult {
  readonly price: number
  readonly change: number
  readonly changePercent: number
  readonly name?: string
  readonly volume?: number
  readonly avgVolume?: number
  readonly high52w?: number
  readonly low52w?: number
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.message },
      { status: 400 }
    )
  }

  const { items } = parsed.data
  const krTickers = items.filter((i) => i.market === "KR").map((i) => i.ticker)
  const usTickers = items.filter((i) => i.market === "US").map((i) => i.ticker)

  const quotes: Record<string, QuoteResult> = {}

  const [krResults, usResults] = await Promise.all([
    krTickers.length > 0
      ? Promise.allSettled(
          krTickers.map(async (ticker) => {
            const q = await getQuote(ticker)
            if (q) {
              quotes[ticker] = {
                price: q.price,
                change: q.change,
                changePercent: q.changePercent,
                name: q.name,
                volume: q.volume,
                high52w: q.fiftyTwoWeekHigh,
                low52w: q.fiftyTwoWeekLow,
              }
            }
          })
        )
      : Promise.resolve([]),
    usTickers.length > 0
      ? getUSQuoteBatch(usTickers).then((map) => {
          for (const [symbol, q] of map) {
            quotes[symbol] = {
              price: q.c,
              change: q.d,
              changePercent: q.dp,
            }
          }
        })
      : Promise.resolve(),
  ])

  void krResults
  void usResults

  return NextResponse.json({ success: true, quotes })
}
