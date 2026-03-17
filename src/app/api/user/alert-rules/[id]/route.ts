import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "../../../../../../auth"
import { prisma } from "@/lib/db/prisma"

const patchSchema = z.object({
  active: z.boolean().optional(),
  threshold: z.number().positive().optional(),
  thresholdUnit: z.string().max(10).optional(),
  notes: z.string().max(200).optional(),
  type: z
    .enum([
      "PRICE_ABOVE",
      "PRICE_BELOW",
      "VOLUME_SPIKE",
      "EARNINGS_DATE",
      "BREAKOUT_RESISTANCE",
      "BREAKDOWN_SUPPORT",
      "EARNINGS_SURPRISE",
      "FOREIGN_BULK_BUY",
      "INSTITUTION_BULK_BUY",
    ])
    .optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params

    const body = await req.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.message },
        { status: 400 }
      )
    }

    const existing = await prisma.alertRule.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Alert rule not found" },
        { status: 404 }
      )
    }

    const updated = await prisma.alertRule.update({
      where: { id },
      data: parsed.data,
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error("Failed to update alert rule:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update alert rule" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params

    const existing = await prisma.alertRule.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Alert rule not found" },
        { status: 404 }
      )
    }

    await prisma.alertRule.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete alert rule:", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete alert rule" },
      { status: 500 }
    )
  }
}
