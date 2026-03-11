import { NextRequest, NextResponse } from "next/server"
import { auth } from "../../../../../auth"
import { prisma } from "@/lib/db/prisma"
import { z } from "zod"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const layout = await prisma.dashboardLayout.findUnique({
    where: { userId: session.user.id },
  })

  if (!layout) {
    return NextResponse.json({ success: true, data: null })
  }

  return NextResponse.json({
    success: true,
    data: {
      cardOrder: layout.cardOrder,
      hiddenCards: layout.hiddenCards,
    },
  })
}

const putSchema = z.object({
  cardOrder: z.array(z.string()),
  hiddenCards: z.array(z.string()),
})

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = putSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "잘못된 요청" }, { status: 400 })
  }

  const layout = await prisma.dashboardLayout.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      cardOrder: parsed.data.cardOrder,
      hiddenCards: parsed.data.hiddenCards,
    },
    update: {
      cardOrder: parsed.data.cardOrder,
      hiddenCards: parsed.data.hiddenCards,
    },
  })

  return NextResponse.json({
    success: true,
    data: {
      cardOrder: layout.cardOrder,
      hiddenCards: layout.hiddenCards,
    },
  })
}
