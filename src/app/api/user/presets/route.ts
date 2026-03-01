import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "../../../../../auth"
import { prisma } from "@/lib/db/prisma"

const schema = z.object({
  presets: z.array(
    z.object({
      id: z.string(),
      name: z.string().min(1).max(100),
      filters: z.record(z.string()),
      createdAt: z.number(),
    })
  ),
})

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.message },
      { status: 400 }
    )
  }

  const userId = session.user.id
  const { presets } = parsed.data

  await prisma.$transaction([
    prisma.screenerPreset.deleteMany({ where: { userId } }),
    prisma.screenerPreset.createMany({
      data: presets.map((p) => ({
        userId,
        name: p.name,
        filters: p.filters,
        createdAt: new Date(p.createdAt),
      })),
    }),
  ])

  return NextResponse.json({ success: true })
}
