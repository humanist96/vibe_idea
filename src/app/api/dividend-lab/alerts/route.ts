import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "../../../../../auth"
import { prisma } from "@/lib/db/prisma"
import { cache, ONE_HOUR } from "@/lib/cache/memory-cache"
import { getAllDividendStocks } from "@/lib/dividend/dividend-data"
import type { DividendStock } from "@/lib/dividend/dividend-types"

const DIVIDEND_ALERT_TYPES = [
  "EX_DATE_D7",
  "DIVIDEND_CHANGE",
  "SAFETY_CHANGE",
  "GAP_MONTH",
] as const

type DividendAlertType = (typeof DIVIDEND_ALERT_TYPES)[number]

interface DividendAlertItem {
  readonly ticker: string
  readonly name: string
  readonly market: "KR" | "US"
  readonly type: "EX_DATE_D7" | "GAP_MONTH"
  readonly message: string
  readonly date: string | null
}

const toggleSchema = z.object({
  ticker: z.string().min(1).max(20),
  market: z.enum(["KR", "US"]),
  alertType: z.enum(DIVIDEND_ALERT_TYPES),
})

function isWithinDays(dateStr: string, days: number): boolean {
  const target = new Date(dateStr)
  const now = new Date()
  const diff = target.getTime() - now.getTime()
  const daysDiff = diff / (1000 * 60 * 60 * 24)
  return daysDiff >= 0 && daysDiff <= days
}

function findGapMonths(paymentMonths: readonly number[]): readonly number[] {
  if (paymentMonths.length === 0) return []
  const allMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  return allMonths.filter((m) => !paymentMonths.includes(m))
}

function buildExDateAlert(stock: DividendStock): DividendAlertItem | null {
  if (!stock.exDividendDate) return null
  if (!isWithinDays(stock.exDividendDate, 7)) return null

  const exDate = new Date(stock.exDividendDate)
  const now = new Date()
  const daysLeft = Math.ceil(
    (exDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )

  return {
    ticker: stock.ticker,
    name: stock.nameKr || stock.name,
    market: stock.market,
    type: "EX_DATE_D7",
    message: `배당락일이 ${daysLeft}일 남았습니다 (${stock.exDividendDate})`,
    date: stock.exDividendDate,
  }
}

function buildGapMonthAlert(
  stock: DividendStock
): DividendAlertItem | null {
  const now = new Date()
  const nextMonth = now.getMonth() + 2 > 12 ? 1 : now.getMonth() + 2
  const gaps = findGapMonths(stock.paymentMonths)

  if (!gaps.includes(nextMonth)) return null

  return {
    ticker: stock.ticker,
    name: stock.nameKr || stock.name,
    market: stock.market,
    type: "GAP_MONTH",
    message: `다음 달(${nextMonth}월)은 배당 공백월입니다`,
    date: null,
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const portfolios = await prisma.dividendPortfolio.findMany({
      where: { userId: session.user.id },
      include: { items: true },
    })

    if (portfolios.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    const tickerSet = new Map<string, string>()
    for (const portfolio of portfolios) {
      for (const item of portfolio.items) {
        tickerSet.set(`${item.ticker}:${item.market}`, item.market)
      }
    }

    if (tickerSet.size === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    const cacheKey = `dividend-lab:alerts:${session.user.id}`
    const cached = cache.get<readonly DividendAlertItem[]>(cacheKey)
    if (cached) {
      return NextResponse.json({ success: true, data: cached })
    }

    const allStocks = await getAllDividendStocks("ALL")
    const portfolioTickers = new Set(tickerSet.keys())

    const alerts: DividendAlertItem[] = []

    for (const stock of allStocks) {
      const key = `${stock.ticker}:${stock.market}`
      if (!portfolioTickers.has(key)) continue

      const exDateAlert = buildExDateAlert(stock)
      if (exDateAlert) {
        alerts.push(exDateAlert)
      }

      const gapAlert = buildGapMonthAlert(stock)
      if (gapAlert) {
        alerts.push(gapAlert)
      }
    }

    const sorted = [...alerts].sort((a, b) => {
      if (a.date && b.date) {
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      }
      if (a.date) return -1
      if (b.date) return 1
      return 0
    })

    cache.set(cacheKey, sorted, ONE_HOUR)
    return NextResponse.json({ success: true, data: sorted })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
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
    const parsed = toggleSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.message },
        { status: 400 }
      )
    }

    const { ticker, market, alertType } = parsed.data

    const existing = await prisma.alertRule.findFirst({
      where: {
        userId: session.user.id,
        ticker,
        market,
        type: alertType,
      },
    })

    if (existing) {
      await prisma.alertRule.delete({ where: { id: existing.id } })
      return NextResponse.json({
        success: true,
        data: { subscribed: false },
      })
    }

    const count = await prisma.alertRule.count({
      where: { userId: session.user.id },
    })

    if (count >= 50) {
      return NextResponse.json(
        { success: false, error: "Maximum 50 alert rules allowed" },
        { status: 400 }
      )
    }

    const rule = await prisma.alertRule.create({
      data: {
        userId: session.user.id,
        ticker,
        market,
        type: alertType,
      },
    })

    return NextResponse.json(
      { success: true, data: { subscribed: true, rule } },
      { status: 201 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
