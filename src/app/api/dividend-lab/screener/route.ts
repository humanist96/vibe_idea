import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAllDividendStocks } from "@/lib/dividend/dividend-data"
import { applyScreenerFilters } from "@/lib/dividend/screener"

const schema = z.object({
  market: z.enum(["KR", "US", "ALL"]).default("ALL"),
  preset: z
    .enum(["high-yield", "growth", "safety", "aristocrat", "monthly", "value"])
    .nullable()
    .default(null),
  filters: z
    .object({
      yieldMin: z.number().min(0).max(100).optional(),
      yieldMax: z.number().min(0).max(100).optional(),
      payoutRatioMax: z.number().min(0).nullable().optional(),
      consecutiveYearsMin: z.number().min(0).optional(),
      growthRateMin: z.number().nullable().optional(),
      marketCapMin: z.number().nullable().optional(),
      sectors: z.array(z.string()).optional(),
      frequency: z
        .array(z.enum(["annual", "semi", "quarterly", "monthly"]))
        .optional(),
      debtToEquityMax: z.number().nullable().optional(),
      fcfCoverageMin: z.number().nullable().optional(),
      perMax: z.number().nullable().optional(),
      pbrMax: z.number().nullable().optional(),
    })
    .optional()
    .default({}),
  sort: z
    .enum([
      "yield",
      "growthRate",
      "safetyScore",
      "consecutiveYears",
      "marketCap",
      "dividendPerShare",
    ])
    .default("yield"),
  order: z.enum(["asc", "desc"]).default("desc"),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
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

    const { market, preset, filters, sort, order, page, limit } = parsed.data

    const allStocks = await getAllDividendStocks(market)
    const result = applyScreenerFilters(
      allStocks,
      preset,
      filters,
      market,
      sort,
      order,
      page,
      limit
    )

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
