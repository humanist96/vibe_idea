import { NextResponse } from "next/server"
import { auth } from "../../../../../auth"
import { prisma } from "@/lib/db/prisma"

/**
 * GET /api/reports/weekly — 로그인 사용자의 주간 보고서 목록
 */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "로그인이 필요합니다." },
      { status: 401 }
    )
  }

  const reports = await prisma.report.findMany({
    where: { userId: session.user.id, type: "weekly" },
    select: {
      id: true,
      date: true,
      stockCount: true,
      summary: true,
      tickers: true,
      generatedAt: true,
      data: true,
    },
    orderBy: { generatedAt: "desc" },
    take: 12,
  })

  return NextResponse.json({
    success: true,
    data: reports.map((r) => {
      const reportData = r.data as Record<string, unknown>
      return {
        id: `weekly-${r.date}`,
        weekStart: r.date,
        weekEnd: (reportData?.weekEnd as string) ?? r.date,
        generatedAt: r.generatedAt.toISOString(),
        stockCount: r.stockCount,
        summary: r.summary,
        tickers: r.tickers,
      }
    }),
  })
}
