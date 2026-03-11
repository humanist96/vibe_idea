import { NextRequest, NextResponse } from "next/server"
import { auth } from "../../../../../../../auth"
import { prisma } from "@/lib/db/prisma"

export async function POST(
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

    const userId = session.user.id

    const idea = await prisma.idea.findUnique({ where: { id } })
    if (!idea) {
      return NextResponse.json(
        { success: false, error: "아이디어를 찾을 수 없습니다." },
        { status: 404 }
      )
    }

    const existing = await prisma.ideaLike.findUnique({
      where: { ideaId_userId: { ideaId: id, userId } },
    })

    if (existing) {
      await prisma.ideaLike.delete({
        where: { ideaId_userId: { ideaId: id, userId } },
      })
    } else {
      await prisma.ideaLike.create({
        data: { ideaId: id, userId },
      })
    }

    const count = await prisma.ideaLike.count({ where: { ideaId: id } })

    return NextResponse.json({ liked: !existing, count })
  } catch (error) {
    console.error("Failed to toggle like:", error)
    return NextResponse.json(
      { success: false, error: "좋아요 처리에 실패했습니다." },
      { status: 500 }
    )
  }
}
