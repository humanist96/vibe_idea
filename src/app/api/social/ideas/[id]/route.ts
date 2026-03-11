import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "../../../../../../auth"
import { prisma } from "@/lib/db/prisma"

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(10000).optional(),
  targetPrice: z.number().positive().nullable().optional(),
  horizon: z.enum(["단기", "중기", "장기"]).nullable().optional(),
  isPublic: z.boolean().optional(),
  direction: z.enum(["LONG", "SHORT"]).optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    const userId = session?.user?.id

    const idea = await prisma.idea.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, image: true } },
        _count: { select: { likes: true, comments: true } },
      },
    })

    if (!idea) {
      return NextResponse.json(
        { success: false, error: "아이디어를 찾을 수 없습니다." },
        { status: 404 }
      )
    }

    if (!idea.isPublic && idea.userId !== userId) {
      return NextResponse.json(
        { success: false, error: "비공개 아이디어입니다." },
        { status: 403 }
      )
    }

    await prisma.idea.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    })

    let liked = false
    if (userId) {
      const like = await prisma.ideaLike.findUnique({
        where: { ideaId_userId: { ideaId: id, userId } },
      })
      liked = !!like
    }

    return NextResponse.json({ ...idea, liked })
  } catch (error) {
    console.error("Failed to fetch idea:", error)
    return NextResponse.json(
      { success: false, error: "아이디어를 불러오지 못했습니다." },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const existing = await prisma.idea.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "아이디어를 찾을 수 없습니다." },
        { status: 404 }
      )
    }
    if (existing.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "수정 권한이 없습니다." },
        { status: 403 }
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

    const updated = await prisma.idea.update({
      where: { id },
      data: parsed.data,
      include: {
        user: { select: { id: true, name: true, image: true } },
        _count: { select: { likes: true, comments: true } },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Failed to update idea:", error)
    return NextResponse.json(
      { success: false, error: "아이디어를 수정하지 못했습니다." },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const existing = await prisma.idea.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "아이디어를 찾을 수 없습니다." },
        { status: 404 }
      )
    }
    if (existing.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "삭제 권한이 없습니다." },
        { status: 403 }
      )
    }

    await prisma.idea.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete idea:", error)
    return NextResponse.json(
      { success: false, error: "아이디어를 삭제하지 못했습니다." },
      { status: 500 }
    )
  }
}
