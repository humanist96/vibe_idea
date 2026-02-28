import { NextRequest, NextResponse } from "next/server"
import { getRanking, type RankingType, type MarketType } from "@/lib/api/naver-ranking"

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const type = (searchParams.get("type") ?? "up") as RankingType
  const market = (searchParams.get("market") ?? "KOSPI") as MarketType
  const page = parseInt(searchParams.get("page") ?? "1", 10)

  if (type !== "up" && type !== "down") {
    return NextResponse.json(
      { success: false, error: "Invalid type. Use 'up' or 'down'" },
      { status: 400 }
    )
  }

  if (market !== "KOSPI" && market !== "KOSDAQ") {
    return NextResponse.json(
      { success: false, error: "Invalid market. Use 'KOSPI' or 'KOSDAQ'" },
      { status: 400 }
    )
  }

  try {
    const data = await getRanking(type, market, page, 20)
    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch ranking data" },
      { status: 500 }
    )
  }
}
