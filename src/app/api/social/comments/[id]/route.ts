import { NextRequest, NextResponse } from "next/server"
import { auth } from "../../../../../../auth"
import { prisma } from "@/lib/db/prisma"

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

    const comment = await prisma.ideaComment.findUnique({ where: { id } })
    if (!comment) {
      return NextResponse.json(
        { success: false, error: "댓글을 찾을 수 없습니다." },
        { status: 404 }
      )
    }
    if (comment.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "삭제 권한이 없습니다." },
        { status: 403 }
      )
    }

    await prisma.ideaComment.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete comment:", error)
    return NextResponse.json(
      { success: false, error: "댓글을 삭제하지 못했습니다." },
      { status: 500 }
    )
  }
}
