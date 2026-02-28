import { NextRequest, NextResponse } from "next/server"
import { getFinanceAnnual, getFinanceQuarter } from "@/lib/api/naver-finance-detail"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params
  const period = request.nextUrl.searchParams.get("period") ?? "annual"

  if (!/^\d{6}$/.test(ticker)) {
    return NextResponse.json(
      { success: false, error: "Invalid ticker format" },
      { status: 400 }
    )
  }

  if (period !== "annual" && period !== "quarter") {
    return NextResponse.json(
      { success: false, error: "Invalid period. Use 'annual' or 'quarter'" },
      { status: 400 }
    )
  }

  try {
    const data = period === "annual"
      ? await getFinanceAnnual(ticker)
      : await getFinanceQuarter(ticker)

    if (!data) {
      return NextResponse.json(
        { success: false, error: "No finance data available" },
        { status: 404 }
      )
    }
    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch finance data" },
      { status: 500 }
    )
  }
}
