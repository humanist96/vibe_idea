import { NextRequest, NextResponse } from "next/server"
import { getConsensus } from "@/lib/api/naver-consensus"

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
    const data = await getConsensus(ticker)
    if (!data) {
      return NextResponse.json(
        { success: false, error: "No consensus data available" },
        { status: 404 }
      )
    }
    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch consensus data" },
      { status: 500 }
    )
  }
}
