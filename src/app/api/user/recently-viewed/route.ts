import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "../../../../../auth"
import { prisma } from "@/lib/db/prisma"

const schema = z.object({
  stocks: z.array(
    z.object({
      ticker: z.string().min(1).max(20),
      name: z.string().min(1).max(100),
      viewedAt: z.number(),
    })
  ),
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
  const { stocks } = parsed.data

  await prisma.$transaction([
    prisma.recentlyViewed.deleteMany({ where: { userId } }),
    prisma.recentlyViewed.createMany({
      data: stocks.map((s) => ({
        userId,
        ticker: s.ticker,
        name: s.name,
        viewedAt: new Date(s.viewedAt),
      })),
    }),
  ])

  return NextResponse.json({ success: true })
}
