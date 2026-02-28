import { NextResponse, type NextRequest } from "next/server"
import { getHistorical } from "@/lib/api/naver-finance"

type Period = "1mo" | "3mo" | "6mo" | "1y" | "3y"

const VALID_PERIODS: Period[] = ["1mo", "3mo", "6mo", "1y", "3y"]

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await params
    const searchParams = request.nextUrl.searchParams
    const period = (searchParams.get("period") ?? "3mo") as Period

    if (!VALID_PERIODS.includes(period)) {
      return NextResponse.json(
        { success: false, error: "유효하지 않은 기간입니다." },
        { status: 400 }
      )
    }

    // Naver historical API works for any valid KRX ticker
    const data = await getHistorical(ticker, period)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Historical API error:", error)
    return NextResponse.json(
      { success: false, error: "히스토리 데이터를 불러올 수 없습니다." },
      { status: 500 }
    )
  }
}
