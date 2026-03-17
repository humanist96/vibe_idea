import { NextRequest, NextResponse } from "next/server"
import { auth } from "../../../../../auth"
import { prisma } from "@/lib/db/prisma"

/**
 * GET /api/reports/[reportId] — 로그인 사용자의 특정 보고서 조회
 * reportId 형식: "daily-2026-03-17" 또는 "weekly-2026-03-10"
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "로그인이 필요합니다." },
      { status: 401 }
    )
  }

  const { reportId } = await params

  // reportId에서 type과 date 추출
  const dashIndex = reportId.indexOf("-")
  if (dashIndex === -1) {
    return NextResponse.json(
      { success: false, error: "잘못된 보고서 ID 형식입니다." },
      { status: 400 }
    )
  }

  const type = reportId.slice(0, dashIndex)
  const date = reportId.slice(dashIndex + 1)

  if (type !== "daily" && type !== "weekly") {
    return NextResponse.json(
      { success: false, error: "잘못된 보고서 유형입니다." },
      { status: 400 }
    )
  }

  const report = await prisma.report.findUnique({
    where: {
      userId_type_date: {
        userId: session.user.id,
        type,
        date,
      },
    },
  })

  if (!report) {
    return NextResponse.json(
      { success: false, error: "보고서를 찾을 수 없습니다." },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true, data: report.data })
}

/**
 * DELETE /api/reports/[reportId] — 본인 보고서 삭제
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "로그인이 필요합니다." },
      { status: 401 }
    )
  }

  const { reportId } = await params
  const dashIndex = reportId.indexOf("-")
  if (dashIndex === -1) {
    return NextResponse.json(
      { success: false, error: "잘못된 보고서 ID 형식입니다." },
      { status: 400 }
    )
  }

  const type = reportId.slice(0, dashIndex)
  const date = reportId.slice(dashIndex + 1)

  // 본인 보고서만 삭제 가능
  const deleted = await prisma.report.deleteMany({
    where: {
      userId: session.user.id,
      type,
      date,
    },
  })

  if (deleted.count === 0) {
    return NextResponse.json(
      { success: false, error: "보고서를 찾을 수 없습니다." },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true })
}
