import { NextResponse, type NextRequest } from "next/server"
import { getFinancialStatements } from "@/lib/api/dart"
import { ensureLoaded, findStock } from "@/lib/data/stock-registry"
import * as corpCodeRegistry from "@/lib/data/corp-code-registry"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await params
    const searchParams = request.nextUrl.searchParams
    const yearParam = searchParams.get("year")

    await ensureLoaded()
    const stock = findStock(ticker)
    if (!stock) {
      return NextResponse.json(
        { success: false, error: "종목을 찾을 수 없습니다." },
        { status: 404 }
      )
    }

    await corpCodeRegistry.ensureLoaded()
    const corpCode = corpCodeRegistry.resolve(ticker)
    if (!corpCode) {
      return NextResponse.json({ success: true, data: [] })
    }

    if (yearParam) {
      const data = await getFinancialStatements(corpCode, yearParam)
      return NextResponse.json({ success: true, data })
    }

    // Try recent years in order
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
