import { NextResponse, type NextRequest } from "next/server"
import { getCompanyOverview, stockCodeToCorpCode } from "@/lib/api/dart"
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

    const corpCode = stockCodeToCorpCode(ticker)
    const data = await getCompanyOverview(corpCode)

    if (!data) {
      return NextResponse.json(
        { success: false, error: "기업 정보를 불러올 수 없습니다." },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Company API error:", error)
    return NextResponse.json(
      { success: false, error: "기업 정보를 불러올 수 없습니다." },
      { status: 500 }
    )
  }
}
