import { NextResponse, type NextRequest } from "next/server"
import { getAIScore } from "@/lib/ai/scoring"
import { findStock } from "@/lib/constants/stocks"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await params

    const stock = findStock(ticker)
    if (!stock) {
      return NextResponse.json(
        { success: false, error: "종목을 찾을 수 없습니다." },
        { status: 404 }
      )
    }

    const score = await getAIScore(ticker)

    if (!score) {
      return NextResponse.json(
        { success: false, error: "AI 분석을 수행할 수 없습니다." },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: score })
  } catch (error) {
    console.error("AI Score API error:", error)
    return NextResponse.json(
      { success: false, error: "AI 분석 중 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}
