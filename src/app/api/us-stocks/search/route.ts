import { NextResponse, type NextRequest } from "next/server"
import { searchUSStocks as searchRegistry } from "@/lib/data/us-stock-registry"
import { searchUSStocks as searchFinnhub } from "@/lib/api/finnhub"

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("q")
    if (!query || query.length < 1) {
      return NextResponse.json({ success: true, data: [] })
    }

    // 1. 로컬 레지스트리에서 먼저 검색 (빠름, API 호출 절약)
    const localResults = searchRegistry(query, 10)

    // 2. 로컬 결과가 3개 미만이면 Finnhub API 검색 추가
    let apiResults: { symbol: string; name: string; type: string }[] = []
    if (localResults.length < 3) {
      try {
        const finnhubResults = await searchFinnhub(query)
        apiResults = finnhubResults.result
          .filter((r) => r.type === "Common Stock" && !r.symbol.includes("."))
          .slice(0, 10)
          .map((r) => ({
            symbol: r.symbol,
            name: r.description,
            type: r.type,
          }))
      } catch {
        // Finnhub 실패 시 로컬 결과만 사용
      }
    }

    // 3. 병합 (중복 제거)
    const seen = new Set(localResults.map((r) => r.symbol))
    const merged = [
      ...localResults.map((r) => ({
        symbol: r.symbol,
        name: r.name,
        nameKr: r.nameKr,
        sector: r.sector,
        sectorKr: r.sectorKr,
        exchange: r.exchange,
        source: "registry" as const,
      })),
      ...apiResults
        .filter((r) => !seen.has(r.symbol))
        .map((r) => ({
          symbol: r.symbol,
          name: r.name,
          nameKr: null as string | null,
          sector: null as string | null,
          sectorKr: null as string | null,
          exchange: null as string | null,
          source: "api" as const,
        })),
    ]

    return NextResponse.json({ success: true, data: merged.slice(0, 15) })
  } catch (error) {
    console.error("US Stock search API error:", error)
    return NextResponse.json(
      { success: false, error: "검색에 실패했습니다." },
      { status: 500 }
    )
  }
}
