import { cache, ONE_DAY } from "@/lib/cache/memory-cache"
import type { FredSeriesResponse, GlobalMacroIndicator } from "./fred-types"

const FRED_BASE_URL = "https://api.stlouisfed.org/fred/series/observations"

function getFredApiKey(): string {
  const key = process.env.FRED_API_KEY
  if (!key) {
    throw new Error("FRED_API_KEY is not configured")
  }
  return key
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

interface FredSeriesConfig {
  readonly name: string
  readonly nameKr: string
  readonly seriesId: string
  readonly unit: string
}

const GLOBAL_INDICATORS: readonly FredSeriesConfig[] = [
  { name: "Fed Funds Rate", nameKr: "미 기준금리", seriesId: "DFF", unit: "%" },
  { name: "US 10Y Treasury", nameKr: "미 10년 국채", seriesId: "DGS10", unit: "%" },
  { name: "Dollar Index", nameKr: "달러 인덱스", seriesId: "DTWEXBGS", unit: "지수" },
  { name: "WTI Crude Oil", nameKr: "WTI 유가", seriesId: "DCOILWTICO", unit: "$/barrel" },
  { name: "Gold Price", nameKr: "금 가격", seriesId: "GOLDAMGBD228NLBM", unit: "$/oz" },
]

async function fetchFredSeries(
  config: FredSeriesConfig
): Promise<GlobalMacroIndicator | null> {
  try {
    const apiKey = getFredApiKey()
    const end = new Date()
    const start = new Date(end)
    start.setFullYear(start.getFullYear() - 1)

    const params = new URLSearchParams({
      series_id: config.seriesId,
      api_key: apiKey,
      file_type: "json",
      observation_start: formatDate(start),
      observation_end: formatDate(end),
      sort_order: "desc",
      limit: "60",
    })

    const res = await fetch(`${FRED_BASE_URL}?${params.toString()}`)
    const data: FredSeriesResponse = await res.json()

    const observations = data.observations ?? []
    const valid = observations
      .filter((o) => o.value !== "." && o.value !== "")
      .map((o) => ({
        date: o.date,
        value: parseFloat(o.value) || 0,
      }))

    if (valid.length === 0) return null

    const latest = valid[0]
    const prev = valid.length >= 2 ? valid[1] : latest

    const change = latest.value - prev.value
    const changePercent = prev.value !== 0 ? (change / prev.value) * 100 : 0

    return {
      name: config.name,
      nameKr: config.nameKr,
      value: latest.value,
      prevValue: prev.value,
      change,
      changePercent,
      unit: config.unit,
      date: latest.date,
      history: [...valid].reverse().slice(-30),
    }
  } catch {
    return null
  }
}

export async function getGlobalMacroOverview(): Promise<GlobalMacroIndicator[]> {
  const cacheKey = "fred:macro:overview"
  const cached = cache.get<GlobalMacroIndicator[]>(cacheKey)
  if (cached) return cached

  const results = await Promise.all(GLOBAL_INDICATORS.map(fetchFredSeries))
  const indicators = results.filter(
    (r): r is GlobalMacroIndicator => r !== null
  )

  cache.set(cacheKey, indicators, ONE_DAY)
  return indicators
}
