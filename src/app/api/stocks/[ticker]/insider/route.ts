import { NextResponse, type NextRequest } from "next/server"
import { getInsiderActivities } from "@/lib/api/dart-insider"
import { ensureLoaded, findStock } from "@/lib/data/stock-registry"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await params

    await ensureLoaded()
    const stock = findStock(ticker)
    if (!stock) {
      return NextResponse.json(
        { success: false, error: "종목을 찾을 수 없습니다." },
        { status: 404 }
      )
    }

    const data = await getInsiderActivities(ticker)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Insider API error:", error)
    return NextResponse.json(
      { success: false, error: "내부자 거래 데이터를 불러올 수 없습니다." },
      { status: 500 }
    )
  }
}
