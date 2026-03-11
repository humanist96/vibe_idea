import { NextResponse } from "next/server"
import { getSectorPerformances } from "@/lib/analysis/sector-rotation"

export const maxDuration = 60

export async function GET() {
  try {
    const performances = await getSectorPerformances()
    return NextResponse.json({ success: true, data: performances })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { success: false, error: `섹터 성과 계산 실패: ${msg}` },
      { status: 500 }
    )
  }
}
