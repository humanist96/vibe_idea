import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "../../../../../../../auth"
import { prisma } from "@/lib/db/prisma"

const commentSchema = z.object({
  content: z.string().min(1).max(2000),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const comments = await prisma.ideaComment.findMany({
      where: { ideaId: id },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error("Failed to fetch comments:", error)
    return NextResponse.json(
      { success: false, error: "댓글을 불러오지 못했습니다." },
      { status: 500 }
    )
  }
}

export async function POST(
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

    const idea = await prisma.idea.findUnique({ where: { id } })
    if (!idea) {
      return NextResponse.json(
        { success: false, error: "아이디어를 찾을 수 없습니다." },
        { status: 404 }
      )
    }

    const body = await req.json()
    const parsed = commentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.message },
        { status: 400 }
      )
    }

    const comment = await prisma.ideaComment.create({
      data: {
        ideaId: id,
        userId: session.user.id,
        content: parsed.data.content,
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error("Failed to create comment:", error)
    return NextResponse.json(
      { success: false, error: "댓글을 작성하지 못했습니다." },
      { status: 500 }
    )
  }
}
