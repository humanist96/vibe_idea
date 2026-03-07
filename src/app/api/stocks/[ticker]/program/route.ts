import { NextRequest, NextResponse } from "next/server"
import { getProgramTrading } from "@/lib/api/naver-program"

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
    const data = await getProgramTrading(ticker)
    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch program trading data" },
      { status: 500 }
    )
  }
}
