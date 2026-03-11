import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "../../../../../auth"
import { prisma } from "@/lib/db/prisma"

const createSchema = z.object({
  ticker: z.string().min(1).max(20),
  market: z.enum(["KR", "US"]),
  direction: z.enum(["LONG", "SHORT"]),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  targetPrice: z.number().positive().optional(),
  horizon: z.enum(["단기", "중기", "장기"]).optional(),
  isPublic: z.boolean().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const userId = session?.user?.id

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, Number(searchParams.get("page") || "1"))
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || "20")))
    const ticker = searchParams.get("ticker")
    const horizon = searchParams.get("horizon")
    const direction = searchParams.get("direction")
    const skip = (page - 1) * limit

    const where = {
      ...(ticker ? { ticker } : {}),
      ...(horizon ? { horizon } : {}),
      ...(direction ? { direction } : {}),
      OR: [
        { isPublic: true },
        ...(userId ? [{ userId }] : []),
      ],
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

    const ideasWithLiked = userId
      ? await addLikedFlag(ideas, userId)
      : ideas.map((idea) => ({ ...idea, liked: false }))

    return NextResponse.json({ ideas: ideasWithLiked, total })
  } catch (error) {
    console.error("Failed to fetch ideas:", error)
    return NextResponse.json(
      { success: false, error: "아이디어 목록을 불러오지 못했습니다." },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.message },
        { status: 400 }
      )
    }

    const idea = await prisma.idea.create({
      data: {
        userId: session.user.id,
        ...parsed.data,
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
        _count: { select: { likes: true, comments: true } },
      },
    })

    return NextResponse.json(idea, { status: 201 })
  } catch (error) {
    console.error("Failed to create idea:", error)
    return NextResponse.json(
      { success: false, error: "아이디어를 생성하지 못했습니다." },
      { status: 500 }
    )
  }
}

async function addLikedFlag(
  ideas: readonly { readonly id: string }[],
  userId: string
) {
  const likes = await prisma.ideaLike.findMany({
    where: {
      userId,
      ideaId: { in: ideas.map((i) => i.id) },
    },
    select: { ideaId: true },
  })
  const likedSet = new Set(likes.map((l) => l.ideaId))
  return ideas.map((idea) => ({ ...idea, liked: likedSet.has(idea.id) }))
}
