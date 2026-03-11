import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "../../../../../auth"
import {
  getUSEarningsCalendar,
  getUSIPOCalendar,
} from "@/lib/api/finnhub"

const querySchema = z.object({
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  type: z.enum(["ALL", "EARNINGS", "IPO"]).default("ALL"),
  days: z.coerce.number().int().min(1).max(90).default(30),
})

type USEventType = "EARNINGS" | "IPO" | "OTHER"

interface USEventItem {
  readonly id: string
  readonly ticker: string
  readonly company: string
  readonly type: USEventType
  readonly title: string
  readonly eventDate: string
  readonly metadata: Record<string, unknown>
  readonly source: "finnhub"
}

function formatDateStr(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(request.url)
  const parsed = querySchema.safeParse({
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    type: searchParams.get("type") ?? "ALL",
    days: searchParams.get("days") ?? "30",
  })

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid query parameters",
        details: parsed.error.flatten(),
      },
      { status: 400 }
    )
  }

  const { type, days } = parsed.data
  const today = new Date()
  const fromDate = parsed.data.from
    ? parsed.data.from
    : formatDateStr(
        new Date(today.getTime() - days * 24 * 60 * 60 * 1000)
      )
  const toDate = parsed.data.to
    ? parsed.data.to
    : formatDateStr(
        new Date(today.getTime() + days * 24 * 60 * 60 * 1000)
      )

  try {
    const events: USEventItem[] = []
    const fetchPromises: Promise<void>[] = []

    if (type === "ALL" || type === "EARNINGS") {
      fetchPromises.push(
        getUSEarningsCalendar(fromDate, toDate)
          .then((earnings) => {
            for (const e of earnings) {
              if (!e.symbol) continue
              const quarterStr = e.quarter && e.year
                ? `Q${e.quarter} FY${e.year}`
                : ""
              events.push({
                id: `EARNINGS:${e.symbol}:${e.date}`,
                ticker: e.symbol,
                company: e.symbol,
                type: "EARNINGS",
                title: quarterStr
                  ? `${quarterStr} 실적 발표`
                  : "실적 발표",
                eventDate: e.date,
                metadata: {
                  type: "EARNINGS",
                  epsEstimate: e.epsEstimate,
                  epsActual: e.epsActual,
                  revenueEstimate: e.revenueEstimate,
                  revenueActual: e.revenueActual,
                  hour: e.hour,
                  quarter: e.quarter,
                  year: e.year,
                },
                source: "finnhub",
              })
            }
          })
          .catch(() => {
            // earnings fetch failed, continue with other sources
          })
      )
    }

    if (type === "ALL" || type === "IPO") {
      fetchPromises.push(
        getUSIPOCalendar(fromDate, toDate)
          .then((ipos) => {
            for (const ipo of ipos) {
              const sym = ipo.symbol || ipo.name
              events.push({
                id: `IPO:${sym}:${ipo.date}`,
                ticker: ipo.symbol || "-",
                company: ipo.name,
                type: "IPO",
                title: `IPO - ${ipo.name}`,
                eventDate: ipo.date,
                metadata: {
                  type: "IPO",
                  price: ipo.price,
                  exchange: ipo.exchange,
                  numberOfShares: ipo.numberOfShares,
                  status: ipo.status,
                },
                source: "finnhub",
              })
            }
          })
          .catch(() => {
            // IPO fetch failed, continue with other sources
          })
      )
    }

    await Promise.all(fetchPromises)

    const sortedEvents = [...events].sort((a, b) =>
      b.eventDate.localeCompare(a.eventDate)
    )

    return NextResponse.json({
      success: true,
      data: sortedEvents.slice(0, 200),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
