import { NextResponse, type NextRequest } from "next/server"
import { getStockData } from "@/lib/api/market-data"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await params
    const stock = await getStockData(ticker)

    if (!stock) {
      return NextResponse.json(
        { success: false, error: "종목을 찾을 수 없습니다." },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: stock })
  } catch (error) {
    console.error("Stock detail API error:", error)
    return NextResponse.json(
      { success: false, error: "종목 데이터를 불러올 수 없습니다." },
      { status: 500 }
    )
  }
}
