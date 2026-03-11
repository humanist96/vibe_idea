import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "../../../../../../auth"
import { prisma } from "@/lib/db/prisma"

const MAX_ITEMS = 20

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  totalAmount: z.number().int().min(1).max(10_000_000).optional(),
  period: z.number().int().min(1).max(30).optional(),
  drip: z.boolean().optional(),
  monthlyAdd: z.number().int().min(0).max(10_000_000).optional(),
  items: z
    .array(
      z.object({
        ticker: z.string().min(1).max(20),
        market: z.enum(["KR", "US"]),
        weight: z.number().min(0).max(100),
      })
    )
    .max(MAX_ITEMS)
    .optional(),
})

async function verifyOwnership(portfolioId: string, userId: string) {
  const portfolio = await prisma.dividendPortfolio.findFirst({
    where: { id: portfolioId, userId },
  })
  return portfolio
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params
    const existing = await verifyOwnership(id, session.user.id)
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Not found" },
        { status: 404 }
      )
    }

    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.message },
        { status: 400 }
      )
    }

    const { items, ...settings } = parsed.data

    const updated = await prisma.$transaction(async (tx) => {
      if (items) {
        await tx.dividendPortfolioItem.deleteMany({
          where: { portfolioId: id },
        })
        await tx.dividendPortfolioItem.createMany({
          data: items.map((item) => ({
            portfolioId: id,
            ticker: item.ticker,
            market: item.market,
            weight: item.weight,
          })),
        })
      }

      return tx.dividendPortfolio.update({
        where: { id },
        data: settings,
        include: { items: true },
      })
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params
    const existing = await verifyOwnership(id, session.user.id)
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Not found" },
        { status: 404 }
      )
    }

    await prisma.dividendPortfolio.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
