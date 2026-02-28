import { cache, FIVE_MINUTES } from "@/lib/cache/memory-cache"

const NAVER_STOCK_API = "https://m.stock.naver.com/api"
const HEADERS = { "User-Agent": "Mozilla/5.0" }

export interface Theme {
  readonly no: string
  readonly name: string
  readonly stockCount: number
  readonly changePercent: number
  readonly description?: string
}

export interface ThemeStock {
  readonly ticker: string
  readonly name: string
  readonly price: number
  readonly change: number
  readonly changePercent: number
  readonly volume: number
}

export interface ThemeStockResult {
  readonly stocks: readonly ThemeStock[]
  readonly totalCount: number
}

export async function getThemeList(): Promise<readonly Theme[]> {
  const cacheKey = "naver:themes"
  const cached = cache.get<readonly Theme[]>(cacheKey)
  if (cached) return cached

  try {
    const allThemes: Theme[] = []
    let page = 1
    const pageSize = 100

    while (true) {
      const res = await fetch(
        `${NAVER_STOCK_API}/stocks/theme?page=${page}&pageSize=${pageSize}`,
        { headers: HEADERS }
      )
      if (!res.ok) break

      const data = await res.json()
      const groups: unknown[] = data?.groups ?? []
      if (groups.length === 0) break

      for (const item of groups) {
        const t = item as Record<string, unknown>
        allThemes.push({
          no: String(t.no ?? t.themeCode ?? ""),
          name: String(t.name ?? t.themeName ?? ""),
          stockCount: Number(t.stockCount ?? t.itemCount ?? 0) || 0,
          changePercent: parseFloat(String(t.changeRate ?? t.fluctuationsRatio ?? "0")) || 0,
          description: t.description ? String(t.description) : undefined,
        })
      }

      const totalCount = typeof data?.totalCount === "number" ? data.totalCount : 0
      if (allThemes.length >= totalCount || groups.length < pageSize) break
      page++
    }

    cache.set(cacheKey, allThemes, FIVE_MINUTES)
    return allThemes
  } catch (error) {
    console.error("Failed to fetch theme list:", error)
    return []
  }
}

export async function getThemeStocks(
  no: string,
  page: number = 1,
  pageSize: number = 10
): Promise<ThemeStockResult> {
  const cacheKey = `naver:theme:${no}:${page}`
  const cached = cache.get<ThemeStockResult>(cacheKey)
  if (cached) return cached

  try {
    const res = await fetch(
      `${NAVER_STOCK_API}/stocks/theme/${no}?page=${page}&pageSize=${pageSize}`,
      { headers: HEADERS }
    )
    if (!res.ok) return { stocks: [], totalCount: 0 }

    const data = await res.json()
    const stocks: unknown[] = data?.stocks ?? data ?? []
    const totalCount = typeof data?.totalCount === "number" ? data.totalCount : stocks.length

    const result: ThemeStockResult = {
      stocks: stocks.map((item) => {
        const s = item as Record<string, unknown>
        return {
          ticker: String(s.itemCode ?? s.stockCode ?? s.code ?? ""),
          name: String(s.stockName ?? s.name ?? ""),
          price: parseNum(s.closePrice ?? s.price),
          change: parseNum(s.compareToPreviousClosePrice ?? s.change),
          changePercent: parseFloat(String(s.fluctuationsRatio ?? s.changeRate ?? "0")) || 0,
          volume: parseNum(s.accumulatedTradingVolume ?? s.volume),
        }
      }),
      totalCount,
    }

    cache.set(cacheKey, result, FIVE_MINUTES)
    return result
  } catch (error) {
    console.error(`Failed to fetch theme stocks ${no}:`, error)
    return { stocks: [], totalCount: 0 }
  }
}

function parseNum(value: unknown): number {
  if (value === null || value === undefined) return 0
  return Number(String(value).replace(/,/g, "")) || 0
}
