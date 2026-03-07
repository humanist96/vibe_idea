import { NextRequest, NextResponse } from "next/server"
import { getShortSelling } from "@/lib/api/naver-short-selling"

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
    const data = await getShortSelling(ticker)
    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch short selling data" },
      { status: 500 }
    )
  }
}
