import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "../../../../../auth"
import { prisma } from "@/lib/db/prisma"

const schema = z.object({
  lastFilters: z.record(z.string()),
  lastSort: z.string().min(1).max(50),
  lastOrder: z.enum(["asc", "desc"]),
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
  const { lastFilters, lastSort, lastOrder } = parsed.data

  await prisma.screenerDefaults.upsert({
    where: { userId },
    update: { lastFilters, lastSort, lastOrder },
    create: { userId, lastFilters, lastSort, lastOrder },
  })

  return NextResponse.json({ success: true })
}
