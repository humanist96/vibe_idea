import { NextResponse, type NextRequest } from "next/server"
import { getTwelveTimeSeries } from "@/lib/api/twelve-data"

const PERIOD_MAP: Record<string, number> = {
  "1W": 7,
  "1M": 22,
  "3M": 66,
  "6M": 130,
  "1Y": 252,
  "5Y": 252 * 5,
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await params
    const symbol = ticker.toUpperCase()
    const period = request.nextUrl.searchParams.get("period") ?? "1Y"

    const outputsize = PERIOD_MAP[period] ?? 252

    const series = await getTwelveTimeSeries(symbol, "1day", outputsize)

    if (!series?.values?.length) {
      return NextResponse.json(
        { success: false, error: "차트 데이터를 찾을 수 없습니다." },
        { status: 404 }
      )
    }

    // Twelve Data는 최신→과거 순서이므로 뒤집기
    const data = [...series.values]
      .reverse()
      .map((v) => ({
        date: v.datetime,
        open: parseFloat(v.open),
        high: parseFloat(v.high),
        low: parseFloat(v.low),
        close: parseFloat(v.close),
        volume: parseInt(v.volume, 10),
      }))

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("US Stock historical API error:", error)
    return NextResponse.json(
      { success: false, error: "차트 데이터를 불러올 수 없습니다." },
      { status: 500 }
    )
  }
}
