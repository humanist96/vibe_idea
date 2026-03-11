import { NextRequest, NextResponse } from "next/server"
import { auth } from "../../../../../../auth"
import { prisma } from "@/lib/db/prisma"

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: targetUserId } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const followerId = session.user.id

    if (followerId === targetUserId) {
      return NextResponse.json(
        { success: false, error: "자기 자신을 팔로우할 수 없습니다." },
        { status: 400 }
      )
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    })
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      )
    }

    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: targetUserId,
        },
      },
    })

    if (existing) {
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId: targetUserId,
          },
        },
      })
    } else {
      await prisma.follow.create({
        data: { followerId, followingId: targetUserId },
      })
    }

    return NextResponse.json({ following: !existing })
  } catch (error) {
    console.error("Failed to toggle follow:", error)
    return NextResponse.json(
      { success: false, error: "팔로우 처리에 실패했습니다." },
      { status: 500 }
    )
  }
}
