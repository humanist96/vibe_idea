import { NextResponse, type NextRequest } from "next/server"
import { getFinancialStatements, stockCodeToCorpCode } from "@/lib/api/dart"
import { findStock } from "@/lib/constants/stocks"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await params
    const searchParams = request.nextUrl.searchParams
    const year = searchParams.get("year") ?? String(new Date().getFullYear() - 1)

    const stock = findStock(ticker)
    if (!stock) {
      return NextResponse.json(
        { success: false, error: "종목을 찾을 수 없습니다." },
        { status: 404 }
      )
    }

    const corpCode = stockCodeToCorpCode(ticker)
    const data = await getFinancialStatements(corpCode, year)

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Financials API error:", error)
    return NextResponse.json(
      { success: false, error: "재무 데이터를 불러올 수 없습니다." },
      { status: 500 }
    )
  }
}
