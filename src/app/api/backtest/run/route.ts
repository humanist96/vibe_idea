import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "../../../../../auth"
import { prisma } from "@/lib/db/prisma"
import { runBacktest } from "@/lib/backtest/engine"
import { getHistorical } from "@/lib/api/naver-finance"
import { getUSCandle } from "@/lib/api/finnhub"
import type { OHLCVBar } from "@/lib/backtest/types"

const conditionSchema = z.object({
  indicator: z.enum([
    "RSI",
    "MA",
    "EMA",
    "MACD",
    "MACD_SIGNAL",
    "BB_UPPER",
    "BB_LOWER",
    "PRICE",
  ]),
  params: z.record(z.number()),
  operator: z.enum([">", "<", ">=", "<=", "crossAbove", "crossBelow"]),
  value: z.number(),
})

const runSchema = z.object({
  ticker: z.string().min(1).max(20),
  market: z.enum(["KR", "US"]),
  period: z.enum(["1y", "3y", "5y"]),
  strategy: z.object({
    buyConditions: z.array(conditionSchema).min(1),
    sellConditions: z.array(conditionSchema).min(1),
    stopLoss: z.number().negative().optional(),
    takeProfit: z.number().positive().optional(),
  }),
})

async function fetchOHLCV(
  ticker: string,
  market: string,
  period: string
): Promise<readonly OHLCVBar[]> {
  if (market === "KR") {
    const naverPeriod = period === "5y" ? "3y" : period === "3y" ? "3y" : "1y"
    const data = await getHistorical(
      ticker,
      naverPeriod as "1y" | "3y"
    )
    return data.map((d) => ({
      date: d.date,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
      volume: d.volume,
    }))
  }

  const yearsMap: Record<string, number> = { "1y": 1, "3y": 3, "5y": 5 }
  const years = yearsMap[period] ?? 1
  const now = Math.floor(Date.now() / 1000)
  const from = now - years * 365 * 24 * 60 * 60

  const candle = await getUSCandle(ticker, "D", from, now)
  if (candle.s !== "ok" || !candle.t?.length) {
    return []
  }

  return candle.t.map((ts, i) => ({
    date: new Date(ts * 1000).toISOString().slice(0, 10),
    open: candle.o[i],
    high: candle.h[i],
    low: candle.l[i],
    close: candle.c[i],
    volume: candle.v[i],
  }))
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const parsed = runSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.message },
        { status: 400 }
      )
    }

    const { ticker, market, period, strategy } = parsed.data
    const bars = await fetchOHLCV(ticker, market, period)

    if (bars.length < 50) {
      return NextResponse.json(
        { success: false, error: "Not enough historical data" },
        { status: 422 }
      )
    }

    const result = runBacktest(bars, strategy)

    await prisma.backtest.create({
      data: {
        userId: session.user.id,
        ticker,
        market,
        period,
        result: JSON.parse(JSON.stringify(result)),
      },
    })

    return NextResponse.json({ success: true, result })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Backtest failed"
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
