import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "../../../../auth"
import { prisma } from "@/lib/db/prisma"

const markReadSchema = z.object({
  ids: z.array(z.string().min(1)),
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
    const readParam = searchParams.get("read")
    const limit = Math.min(
      parseInt(searchParams.get("limit") ?? "50", 10),
      100
    )

    const where: Record<string, unknown> = {
      userId: session.user.id,
    }

    if (readParam === "false") {
      where.read = false
    } else if (readParam === "true") {
      where.read = true
    }

    const notifications = await prisma.alertNotification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    })

    const unreadCount = await prisma.alertNotification.count({
      where: { userId: session.user.id, read: false },
    })

    return NextResponse.json({
      success: true,
      data: notifications,
      meta: { unreadCount },
    })
  } catch (error) {
    console.error("Failed to fetch notifications:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch notifications" },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const parsed = markReadSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.message },
        { status: 400 }
      )
    }

    await prisma.alertNotification.updateMany({
      where: {
        id: { in: parsed.data.ids },
        userId: session.user.id,
      },
      data: { read: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to mark notifications as read:", error)
    return NextResponse.json(
      { success: false, error: "Failed to mark notifications as read" },
      { status: 500 }
    )
  }
}
