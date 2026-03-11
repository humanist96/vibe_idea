import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getDividendStockBatch } from "@/lib/dividend/dividend-data"
import { simulatePortfolio } from "@/lib/dividend/simulator"

const schema = z.object({
  settings: z.object({
    totalAmount: z.number().int().min(1).max(10_000_000),
    period: z.number().int().min(1).max(30),
    drip: z.boolean(),
    monthlyAdd: z.number().int().min(0).max(10_000_000),
    dividendGrowthRate: z.number().min(0).max(30).default(3),
  }),
  items: z
    .array(
      z.object({
        ticker: z.string().min(1).max(20),
        market: z.enum(["KR", "US"]),
        weight: z.number().min(0).max(100),
        name: z.string().default(""),
        nameKr: z.string().default(""),
        sectorKr: z.string().default(""),
      })
    )
    .max(20),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.message },
        { status: 400 }
      )
    }

    const { settings, items } = parsed.data

    if (items.length === 0) {
      return NextResponse.json(
        { success: false, error: "종목을 1개 이상 추가해주세요." },
        { status: 400 }
      )
    }

    // 배당 데이터 조회
    const stocksMap = await getDividendStockBatch(
      items.map((i) => ({ ticker: i.ticker, market: i.market }))
    )

    const result = simulatePortfolio({
      settings,
      items,
      stocks: stocksMap,
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
