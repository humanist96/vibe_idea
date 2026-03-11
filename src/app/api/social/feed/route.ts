import { NextRequest, NextResponse } from "next/server"
import { auth } from "../../../../../auth"
import { prisma } from "@/lib/db/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, Number(searchParams.get("page") || "1"))
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || "20")))
    const skip = (page - 1) * limit

    const followingList = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    })

    const followingIds = followingList.map((f) => f.followingId)

    if (followingIds.length === 0) {
      return NextResponse.json({ ideas: [], total: 0 })
    }

    const where = {
      userId: { in: followingIds },
      isPublic: true,
    }

    const [ideas, total] = await Promise.all([
      prisma.idea.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, image: true } },
          _count: { select: { likes: true, comments: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.idea.count({ where }),
    ])

    const likes = await prisma.ideaLike.findMany({
      where: {
        userId,
        ideaId: { in: ideas.map((i) => i.id) },
      },
      select: { ideaId: true },
    })
    const likedSet = new Set(likes.map((l) => l.ideaId))

    const ideasWithLiked = ideas.map((idea) => ({
      ...idea,
      liked: likedSet.has(idea.id),
    }))

    return NextResponse.json({ ideas: ideasWithLiked, total })
  } catch (error) {
    console.error("Failed to fetch feed:", error)
    return NextResponse.json(
      { success: false, error: "피드를 불러오지 못했습니다." },
      { status: 500 }
    )
  }
}
