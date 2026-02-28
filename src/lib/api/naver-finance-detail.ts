import { cache, ONE_HOUR } from "@/lib/cache/memory-cache"

const NAVER_STOCK_API = "https://m.stock.naver.com/api"
const HEADERS = { "User-Agent": "Mozilla/5.0" }

export interface FinanceColumn {
  readonly title: string
  readonly key: string
  readonly isConsensus: boolean
}

export interface FinanceRow {
  readonly title: string
  readonly values: readonly (string | null)[]
}

export interface FinanceData {
  readonly columns: readonly FinanceColumn[]
  readonly rows: readonly FinanceRow[]
}

export async function getFinanceAnnual(ticker: string): Promise<FinanceData | null> {
  return fetchFinance(ticker, "annual")
}

export async function getFinanceQuarter(ticker: string): Promise<FinanceData | null> {
  return fetchFinance(ticker, "quarter")
}

async function fetchFinance(
  ticker: string,
  period: "annual" | "quarter"
): Promise<FinanceData | null> {
  const cacheKey = `naver:finance:${period}:${ticker}`
  const cached = cache.get<FinanceData>(cacheKey)
  if (cached) return cached

  try {
    const res = await fetch(`${NAVER_STOCK_API}/stock/${ticker}/finance/${period}`, {
      headers: HEADERS,
    })

    if (!res.ok) return null

    const data = await res.json()

    // trTitleList: [{isConsensus:"N"|"Y", title:"2024.12.", key:"202412"}, ...]
    const rawColumns: unknown[] = data?.financeInfo?.trTitleList ?? []
    // rowList: [{title:"매출액", columns:{"202412":{value:"3,008,709",cx:null}, ...}}, ...]
    const rawRows: unknown[] = data?.financeInfo?.rowList ?? []

    if (rawColumns.length === 0 || rawRows.length === 0) return null

    const columns: FinanceColumn[] = rawColumns.map((item) => {
      const col = item as Record<string, unknown>
      return {
        title: String(col.title ?? ""),
        key: String(col.key ?? ""),
        isConsensus: col.isConsensus === "Y",
      }
    })

    const columnKeys = columns.map((c) => c.key)

    const rows: FinanceRow[] = rawRows.map((item) => {
      const row = item as Record<string, unknown>
      const colsObj = (row.columns ?? {}) as Record<string, unknown>

      const values = columnKeys.map((key) => {
        const cell = colsObj[key] as Record<string, unknown> | undefined
        if (!cell) return null
        const val = cell.value
        if (val === null || val === undefined || val === "" || val === "-") return null
        return String(val)
      })

      return {
        title: String(row.title ?? ""),
        values,
      }
    })

    const result: FinanceData = { columns, rows }
    cache.set(cacheKey, result, ONE_HOUR)
    return result
  } catch (error) {
    console.error(`Failed to fetch finance ${period} for ${ticker}:`, error)
    return null
  }
}
