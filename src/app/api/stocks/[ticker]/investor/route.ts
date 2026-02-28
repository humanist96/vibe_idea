import { NextRequest, NextResponse } from "next/server"
import { getInvestorFlow } from "@/lib/api/naver-investor"

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
    const flow = await getInvestorFlow(ticker)
    return NextResponse.json({ success: true, data: flow })
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch investor flow" },
      { status: 500 }
    )
  }
}
