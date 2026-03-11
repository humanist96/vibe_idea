import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { checkAlertRules } from "@/lib/notifications/alert-checker"
import type { AlertRuleData, PriceData, Market } from "@/lib/notifications/types"

export const dynamic = "force-dynamic"

async function fetchPriceData(
  tickers: readonly { readonly ticker: string; readonly market: string }[]
): Promise<ReadonlyMap<string, PriceData>> {
  const priceMap = new Map<string, PriceData>()

  for (const { ticker, market } of tickers) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"
      const apiPath =
        market === "US"
          ? `/api/us-stocks/${ticker}`
          : `/api/stocks/${ticker}`

      const res = await fetch(`${baseUrl}${apiPath}`, {
        cache: "no-store",
      })

      if (res.ok) {
        const data = await res.json()
        const key = `${ticker}:${market}`

        priceMap.set(key, {
          ticker,
          market: market as Market,
          currentPrice: data.price ?? data.currentPrice ?? 0,
          previousClose: data.previousClose ?? 0,
          volume: data.volume ?? 0,
          averageVolume: data.averageVolume ?? data.avgVolume ?? 0,
        })
      }
    } catch (error) {
      console.error(`Failed to fetch price for ${ticker}:`, error)
    }
  }

  return priceMap
}

export async function POST(req: NextRequest) {
  try {
    const cronSecret = req.headers.get("x-cron-secret")
    const expectedSecret = process.env.CRON_SECRET

    if (expectedSecret && cronSecret !== expectedSecret) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const activeRules = await prisma.alertRule.findMany({
      where: { active: true },
    })

    if (activeRules.length === 0) {
      return NextResponse.json({ success: true, triggered: 0 })
    }

    const uniqueTickers = [
      ...new Map(
        activeRules.map((r) => [`${r.ticker}:${r.market}`, { ticker: r.ticker, market: r.market }])
      ).values(),
    ]

    const prices = await fetchPriceData(uniqueTickers)

    const rules: readonly AlertRuleData[] = activeRules.map((r) => ({
      id: r.id,
      userId: r.userId,
      ticker: r.ticker,
      market: r.market as Market,
      type: r.type as AlertRuleData["type"],
      threshold: r.threshold,
      active: r.active,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }))

    const triggered = checkAlertRules(rules, prices)

    if (triggered.length > 0) {
      await prisma.alertNotification.createMany({
        data: triggered.map((t) => ({
          userId: t.userId,
          ruleId: t.ruleId,
          ticker: t.ticker,
          type: t.type,
          message: t.message,
        })),
      })
    }

    return NextResponse.json({
      success: true,
      triggered: triggered.length,
      checked: activeRules.length,
    })
  } catch (error) {
    console.error("Alert check failed:", error)
    return NextResponse.json(
      { success: false, error: "Alert check failed" },
      { status: 500 }
    )
  }
}
