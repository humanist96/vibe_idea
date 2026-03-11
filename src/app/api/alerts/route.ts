import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "../../../../auth"
import { prisma } from "@/lib/db/prisma"

const createSchema = z.object({
  ticker: z.string().min(1).max(20),
  market: z.enum(["KR", "US"]),
  type: z.enum(["PRICE_ABOVE", "PRICE_BELOW", "VOLUME_SPIKE", "EARNINGS_DATE"]),
  threshold: z.number().positive().optional(),
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

    const rules = await prisma.alertRule.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ success: true, data: rules })
  } catch (error) {
    console.error("Failed to fetch alerts:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch alerts" },
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

    const { ticker, market, type, threshold } = parsed.data

    const existingCount = await prisma.alertRule.count({
      where: { userId: session.user.id },
    })

    if (existingCount >= 50) {
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
        type,
        threshold: threshold ?? null,
      },
    })

    return NextResponse.json({ success: true, data: rule }, { status: 201 })
  } catch (error) {
    console.error("Failed to create alert:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create alert" },
      { status: 500 }
    )
  }
}
