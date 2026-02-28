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
    const yearParam = searchParams.get("year")

    const stock = findStock(ticker)
    if (!stock) {
      return NextResponse.json(
        { success: false, error: "종목을 찾을 수 없습니다." },
        { status: 404 }
      )
    }

    const corpCode = stockCodeToCorpCode(ticker)

    if (yearParam) {
      const data = await getFinancialStatements(corpCode, yearParam)
      return NextResponse.json({ success: true, data })
    }

    // Try recent years in order (latest annual report may not be filed yet)
    const currentYear = new Date().getFullYear()
    for (const year of [currentYear - 1, currentYear - 2]) {
      const data = await getFinancialStatements(corpCode, String(year))
      if (data.length > 0) {
        return NextResponse.json({ success: true, data, year })
      }
    }

    return NextResponse.json({ success: true, data: [] })
  } catch (error) {
    console.error("Financials API error:", error)
    return NextResponse.json(
      { success: false, error: "재무 데이터를 불러올 수 없습니다." },
      { status: 500 }
    )
  }
}
