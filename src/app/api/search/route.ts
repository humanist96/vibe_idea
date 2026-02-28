import { NextResponse, type NextRequest } from "next/server"
import { searchStocks } from "@/lib/constants/stocks"

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? ""

  if (query.length < 1) {
    return NextResponse.json({ success: true, data: [] })
  }

  const results = searchStocks(query).slice(0, 10)
  return NextResponse.json({ success: true, data: results })
}
