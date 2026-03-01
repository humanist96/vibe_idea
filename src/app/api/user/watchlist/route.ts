import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "../../../../../auth"
import { prisma } from "@/lib/db/prisma"

const schema = z.object({
  tickers: z.array(z.string().min(1).max(20)),
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
  const { tickers } = parsed.data

  await prisma.$transaction([
    prisma.watchlistItem.deleteMany({ where: { userId } }),
    prisma.watchlistItem.createMany({
      data: tickers.map((ticker) => ({ userId, ticker })),
    }),
  ])

  return NextResponse.json({ success: true })
}
