import { NextResponse } from "next/server"
import { ensureLoaded, getSectors } from "@/lib/data/stock-registry"

export async function GET() {
  try {
    await ensureLoaded()
    const sectors = getSectors()
    return NextResponse.json({ success: true, data: sectors })
  } catch (error) {
    console.error("Sectors API error:", error)
    return NextResponse.json(
      { success: false, error: "섹터 목록을 불러올 수 없습니다." },
      { status: 500 }
    )
  }
}
