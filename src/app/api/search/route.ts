import { NextResponse, type NextRequest } from "next/server"
import {
  ensureLoaded,
  searchStocks,
} from "@/lib/data/stock-registry"

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? ""

  if (query.length < 1) {
    return NextResponse.json({ success: true, data: [] })
  }

  try {
    await ensureLoaded()
    const results = searchStocks(query, 20)
    return NextResponse.json({ success: true, data: results })
  } catch (error) {
    console.error("Search API error:", error)
    return NextResponse.json({ success: true, data: [] })
  }
}
