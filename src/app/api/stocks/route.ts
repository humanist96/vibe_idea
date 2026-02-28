import { NextResponse } from "next/server"
import { getTopStocks } from "@/lib/api/market-data"

export async function GET() {
  try {
    const stocks = await getTopStocks(30)
    return NextResponse.json({ success: true, data: stocks })
  } catch (error) {
    console.error("Stocks API error:", error)
    return NextResponse.json(
      { success: false, error: "종목 데이터를 불러올 수 없습니다." },
      { status: 500 }
    )
  }
}
