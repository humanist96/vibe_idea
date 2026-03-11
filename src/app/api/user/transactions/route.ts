import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "../../../../../auth"
import { prisma } from "@/lib/db/prisma"

const createSchema = z.object({
  ticker: z.string().min(1).max(20),
  market: z.enum(["KR", "US"]),
  type: z.enum(["BUY", "SELL"]),
  quantity: z.number().positive(),
  price: z.number().positive(),
  fee: z.number().min(0).optional().default(0),
  date: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  note: z.string().max(500).optional(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const ticker = searchParams.get("ticker")
    const limit = Math.min(
      parseInt(searchParams.get("limit") ?? "50", 10),
      200
    )

    const where: Record<string, unknown> = { userId: session.user.id }
    if (ticker) {
      where.ticker = ticker
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { date: "desc" },
      take: limit,
    })

    return NextResponse.json({ success: true, transactions })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch transactions"
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
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.message },
        { status: 400 }
      )
    }

    const { ticker, market, type, quantity, price, fee, date, note } =
      parsed.data

    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        ticker,
        market,
        type,
        quantity,
        price,
        fee,
        date: new Date(date),
        note,
      },
    })

    return NextResponse.json({ success: true, transaction })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create transaction"
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
