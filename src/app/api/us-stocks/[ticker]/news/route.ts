import { NextResponse, type NextRequest } from "next/server"
import { getUSNews } from "@/lib/api/finnhub"

/** Finnhub Yahoo 뉴스는 실제 썸네일 대신 Yahoo Finance 로고(354x50)를 반환 — 필터링 */
const PLACEHOLDER_PATTERNS = [
  "yahoo_finance_en-US",
  "s.yimg.com/rz/stage",
  "g.foolcdn.com/misc-assets",
]

function isValidThumbnail(url: string | undefined): boolean {
  if (!url || !url.startsWith("http")) return false
  return !PLACEHOLDER_PATTERNS.some((p) => url.includes(p))
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await params
    const symbol = ticker.toUpperCase()

    const news = await getUSNews(symbol, 7)

    const data = news.map((item) => ({
      id: item.id,
      headline: item.headline,
      summary: item.summary,
      source: item.source,
      url: item.url,
      image: isValidThumbnail(item.image) ? item.image : "",
      datetime: item.datetime,
      related: item.related,
    }))

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("US Stock news API error:", error)
    return NextResponse.json(
      { success: false, error: "뉴스를 불러올 수 없습니다." },
      { status: 500 }
    )
  }
}
