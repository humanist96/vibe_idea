import { NextRequest, NextResponse } from "next/server"
import { cache } from "@/lib/cache/memory-cache"
import type { AnalyzedReportData } from "@/lib/report/types"

/**
 * GET /api/reports/[reportId] — 서버 캐시에서 보고서 조회
 * (주로 클라이언트 localStorage에서 조회하고, 이 API는 폴백용)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const { reportId } = await params

  const cacheKey = `report:id:${reportId}`
  const cached = cache.get<AnalyzedReportData>(cacheKey)

  if (cached) {
    return NextResponse.json({ success: true, data: cached })
  }

  return NextResponse.json(
    { success: false, error: "보고서를 찾을 수 없습니다. 새로 생성해주세요." },
    { status: 404 }
  )
}
