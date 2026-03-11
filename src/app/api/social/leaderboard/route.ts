import { NextRequest, NextResponse } from "next/server"
import { auth } from "../../../../../auth"
import { prisma } from "@/lib/db/prisma"

interface LeaderboardEntry {
  readonly userId: string
  readonly displayName: string
  readonly returnPct: number | null
  readonly sharpe: number | null
  readonly followerCount: number
  readonly ideaCount: number
}

export async function GET(req: NextRequest) {
  try {
    await auth()

    const { searchParams } = new URL(req.url)
    const sortBy = searchParams.get("by") || "followers"
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || "50")))

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            ideas: true,
            followers: true,
          },
        },
      },
      where: {
        ideas: { some: { isPublic: true } },
      },
    })

    const entries: readonly LeaderboardEntry[] = users.map((u) => ({
      userId: u.id,
      displayName: u.name || "익명",
      returnPct: null,
      sharpe: null,
      followerCount: u._count.followers,
      ideaCount: u._count.ideas,
    }))

    const sorted = [...entries].sort((a, b) => {
      if (sortBy === "return") {
        return (b.returnPct ?? -Infinity) - (a.returnPct ?? -Infinity)
      }
      if (sortBy === "sharpe") {
        return (b.sharpe ?? -Infinity) - (a.sharpe ?? -Infinity)
      }
      return b.followerCount - a.followerCount
    })

    return NextResponse.json(sorted.slice(0, limit))
  } catch (error) {
    console.error("Failed to fetch leaderboard:", error)
    return NextResponse.json(
      { success: false, error: "리더보드를 불러오지 못했습니다." },
      { status: 500 }
    )
  }
}
