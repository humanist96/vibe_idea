import { NextResponse } from "next/server"

/**
 * GET /api/reports/daily — 보고서 목록은 클라이언트 localStorage에서 관리.
 * 이 엔드포인트는 향후 DB 연동 시 사용 가능.
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    data: [],
    message: "보고서 목록은 클라이언트에서 관리됩니다.",
  })
}
