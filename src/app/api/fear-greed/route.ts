import { NextResponse } from "next/server"
import { getFearGreedIndex } from "@/lib/api/fear-greed"

export async function GET() {
  try {
    const data = await getFearGreedIndex()
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Fear & Greed API error:", error)
    return NextResponse.json(
      { success: false, error: "공포-탐욕 지수를 불러올 수 없습니다." },
      { status: 500 }
    )
  }
}
