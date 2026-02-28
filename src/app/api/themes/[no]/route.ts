import { NextRequest, NextResponse } from "next/server"
import { getThemeStocks } from "@/lib/api/naver-theme"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ no: string }> }
) {
  const { no } = await params
  const page = parseInt(request.nextUrl.searchParams.get("page") ?? "1", 10)
  const pageSize = parseInt(request.nextUrl.searchParams.get("pageSize") ?? "10", 10)

  try {
    const data = await getThemeStocks(no, page, pageSize)
    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch theme stocks" },
      { status: 500 }
    )
  }
}
