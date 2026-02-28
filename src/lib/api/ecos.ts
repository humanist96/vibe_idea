import { cache, ONE_HOUR } from "@/lib/cache/memory-cache"
import type { EcosApiResponse, MacroIndicator } from "./ecos-types"

const ECOS_BASE_URL = "https://ecos.bok.or.kr/api/StatisticSearch"

function getEcosApiKey(): string {
  const key = process.env.ECOS_API_KEY
  if (!key) {
    throw new Error("ECOS_API_KEY is not configured")
  }
  return key
}

function formatEcosDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  return `${y}${m}`
}

function formatEcosDailyDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}${m}${day}`
}

interface EcosSeriesConfig {
  readonly name: string
  readonly nameEn: string
  readonly statCode: string
  readonly itemCode: string
  readonly unit: string
  readonly freq: "M" | "D"
}

const KOREAN_INDICATORS: readonly EcosSeriesConfig[] = [
  { name: "기준금리", nameEn: "Base Rate", statCode: "722Y001", itemCode: "0101000", unit: "%", freq: "M" },
  { name: "원/달러 환율", nameEn: "USD/KRW", statCode: "731Y001", itemCode: "0000001", unit: "원", freq: "D" },
  { name: "소비자물가지수", nameEn: "CPI", statCode: "901Y009", itemCode: "0", unit: "지수", freq: "M" },
  { name: "M2 통화량", nameEn: "M2", statCode: "101Y018", itemCode: "BBGA00", unit: "십억원", freq: "M" },
]

async function fetchEcosSeries(
  config: EcosSeriesConfig
): Promise<MacroIndicator | null> {
  try {
    const apiKey = getEcosApiKey()
    const now = new Date()
    const start = new Date(now)
    start.setFullYear(start.getFullYear() - 1)

    const startDate = config.freq === "D" ? formatEcosDailyDate(start) : formatEcosDate(start)
    const endDate = config.freq === "D" ? formatEcosDailyDate(now) : formatEcosDate(now)

    const url = `${ECOS_BASE_URL}/${apiKey}/json/kr/1/100/${config.statCode}/${config.freq}/${startDate}/${endDate}/${config.itemCode}`
    const res = await fetch(url)
    const data: EcosApiResponse = await res.json()

    const rows = data.StatisticSearch?.row
    if (!rows || rows.length === 0) return null

    const validRows = rows.filter((r) => r.DATA_VALUE && r.DATA_VALUE !== "")
    if (validRows.length === 0) return null

    const history = validRows.map((r) => ({
      date: r.TIME,
      value: parseFloat(r.DATA_VALUE.replace(/,/g, "")) || 0,
    }))

    const latest = history[history.length - 1]
    const prev = history.length >= 2 ? history[history.length - 2] : latest

    const change = latest.value - prev.value
    const changePercent = prev.value !== 0 ? (change / prev.value) * 100 : 0

    return {
      name: config.name,
      nameEn: config.nameEn,
      value: latest.value,
      prevValue: prev.value,
      change,
      changePercent,
      unit: config.unit,
      date: latest.date,
      history: history.slice(-12),
    }
  } catch {
    return null
  }
}

export async function getKoreanMacroOverview(): Promise<MacroIndicator[]> {
  const cacheKey = "ecos:macro:overview"
  const cached = cache.get<MacroIndicator[]>(cacheKey)
  if (cached) return cached

  const results = await Promise.all(KOREAN_INDICATORS.map(fetchEcosSeries))
  const indicators = results.filter((r): r is MacroIndicator => r !== null)

  cache.set(cacheKey, indicators, ONE_HOUR)
  return indicators
}
