import { NextRequest, NextResponse } from "next/server"
import { getFinanceQuarter } from "@/lib/api/naver-finance-detail"
import { analyzeEarningsSurprise } from "@/lib/analysis/earnings-surprise"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params

  if (!/^\d{6}$/.test(ticker)) {
    return NextResponse.json(
      { success: false, error: "Invalid ticker format" },
      { status: 400 }
    )
  }

  try {
    const quarterData = await getFinanceQuarter(ticker)
    const result = analyzeEarningsSurprise(quarterData, ticker)
    return NextResponse.json({ success: true, data: result })
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to analyze earnings" },
      { status: 500 }
    )
  }
}
