import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "../../../../../auth"
import { prisma } from "@/lib/db/prisma"

const schema = z.object({
  notifications: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      ticker: z.string(),
      stockName: z.string(),
      message: z.string(),
      date: z.string(),
      read: z.boolean(),
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
  const { notifications } = parsed.data

  await prisma.$transaction([
    prisma.userNotification.deleteMany({ where: { userId } }),
    prisma.userNotification.createMany({
      data: notifications.map((n) => ({
        userId,
        type: n.type,
        ticker: n.ticker,
        stockName: n.stockName,
        message: n.message,
        date: n.date,
        read: n.read,
      })),
    }),
  ])

  return NextResponse.json({ success: true })
}
