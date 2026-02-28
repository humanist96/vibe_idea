import { NextResponse } from "next/server"
import { getMarketIndices } from "@/lib/api/naver-finance"

export async function GET() {
  try {
    const indices = await getMarketIndices()
    return NextResponse.json({ success: true, data: indices })
  } catch (error) {
    console.error("Market API error:", error)
    return NextResponse.json(
      { success: false, error: "시장 데이터를 불러올 수 없습니다." },
      { status: 500 }
    )
  }
}
