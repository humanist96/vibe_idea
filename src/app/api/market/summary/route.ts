import { NextResponse } from "next/server"
import { cache, ONE_HOUR } from "@/lib/cache/memory-cache"
import { getMarketIndices } from "@/lib/api/naver-finance"

export async function GET() {
  try {
    const cacheKey = "market:summary:oneliner"
    const cached = cache.get<string>(cacheKey)
    if (cached) {
      return NextResponse.json({ success: true, data: { summary: cached } })
    }

    const indices = await getMarketIndices()

    if (!indices || indices.length === 0) {
      return NextResponse.json({
        success: true,
        data: { summary: null },
      })
    }

    const parts = indices.map((idx) => {
      const dir = idx.change > 0 ? "상승" : idx.change < 0 ? "하락" : "보합"
      return `${idx.name} ${idx.value.toLocaleString("ko-KR")}(${dir} ${Math.abs(idx.changePercent).toFixed(2)}%)`
    })

    const summary = `오늘 ${parts.join(", ")}으로 마감했습니다.`

    cache.set(cacheKey, summary, ONE_HOUR)
    return NextResponse.json({ success: true, data: { summary } })
  } catch (error) {
    console.error("Market summary error:", error)
    return NextResponse.json(
      { success: false, error: "시장 요약을 생성할 수 없습니다." },
      { status: 500 }
    )
  }
}
