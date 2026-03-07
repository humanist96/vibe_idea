import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "../../../../../auth"
import { prisma } from "@/lib/db/prisma"

const itemSchema = z.object({
  ticker: z.string().min(1).max(20),
  market: z.enum(["KR", "US"]),
  name: z.string().min(1).max(100),
  sectorKr: z.string().max(50),
  quantity: z.number().int().min(1),
  avgPrice: z.number().min(0),
  addedAt: z.number(),
})

const schema = z.object({
  items: z.array(itemSchema),
})

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.message },
      { status: 400 }
    )
  }

  const userId = session.user.id
  const { items } = parsed.data

  await prisma.$transaction([
    prisma.portfolioItem.deleteMany({ where: { userId } }),
    prisma.portfolioItem.createMany({
      data: items.map((item) => ({
        userId,
        ticker: item.ticker,
        market: item.market,
        name: item.name,
        sectorKr: item.sectorKr,
        quantity: item.quantity,
        avgPrice: item.avgPrice,
      })),
    }),
  ])

  return NextResponse.json({ success: true })
}
