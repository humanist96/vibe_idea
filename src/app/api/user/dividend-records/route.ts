import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "../../../../../auth"
import { prisma } from "@/lib/db/prisma"

const createSchema = z.object({
  ticker: z.string().min(1).max(20),
  market: z.enum(["KR", "US"]),
  amount: z.number().positive(),
  currency: z.enum(["KRW", "USD"]).optional().default("KRW"),
  receivedAt: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const records = await prisma.dividendRecord.findMany({
      where: { userId: session.user.id },
      orderBy: { receivedAt: "desc" },
      take: 100,
    })

    return NextResponse.json({ success: true, records })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch dividend records"
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

    const { ticker, market, amount, currency, receivedAt } = parsed.data

    const record = await prisma.dividendRecord.create({
      data: {
        userId: session.user.id,
        ticker,
        market,
        amount,
        currency,
        receivedAt: new Date(receivedAt),
      },
    })

    return NextResponse.json({ success: true, record })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create dividend record"
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
