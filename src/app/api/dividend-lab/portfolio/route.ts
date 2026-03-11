import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "../../../../../auth"
import { prisma } from "@/lib/db/prisma"

const MAX_PORTFOLIOS = 10
const MAX_ITEMS = 20

const createSchema = z.object({
  name: z.string().min(1).max(100),
  totalAmount: z.number().int().min(1).max(10_000_000),
  period: z.number().int().min(1).max(30),
  drip: z.boolean(),
  monthlyAdd: z.number().int().min(0).max(10_000_000),
  items: z
    .array(
      z.object({
        ticker: z.string().min(1).max(20),
        market: z.enum(["KR", "US"]),
        weight: z.number().min(0).max(100),
      })
    )
    .max(MAX_ITEMS),
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

    const portfolios = await prisma.dividendPortfolio.findMany({
      where: { userId: session.user.id },
      include: { items: true },
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json({ success: true, data: portfolios })
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
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.message },
        { status: 400 }
      )
    }

    const userId = session.user.id
    const { items, ...settings } = parsed.data

    // 포트폴리오 개수 제한
    const count = await prisma.dividendPortfolio.count({ where: { userId } })
    if (count >= MAX_PORTFOLIOS) {
      return NextResponse.json(
        { success: false, error: `최대 ${MAX_PORTFOLIOS}개까지 생성 가능합니다.` },
        { status: 400 }
      )
    }

    const portfolio = await prisma.dividendPortfolio.create({
      data: {
        userId,
        ...settings,
        items: {
          create: items.map((item) => ({
            ticker: item.ticker,
            market: item.market,
            weight: item.weight,
          })),
        },
      },
      include: { items: true },
    })

    return NextResponse.json({ success: true, data: portfolio })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
