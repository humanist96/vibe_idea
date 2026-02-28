import { cache, FIVE_MINUTES, ONE_HOUR } from "@/lib/cache/memory-cache"

const NAVER_STOCK_API = "https://m.stock.naver.com/api"
const NAVER_CHART_API = "https://fchart.stock.naver.com/siseJson.nhn"
const NAVER_MARKETINDEX_API = "https://api.stock.naver.com/marketindex/exchange"
const HEADERS = { "User-Agent": "Mozilla/5.0" }

export interface StockQuote {
  readonly ticker: string
  readonly name: string
  readonly price: number
  readonly change: number
  readonly changePercent: number
  readonly volume: number
  readonly marketCap: number
  readonly previousClose: number
  readonly dayHigh: number
  readonly dayLow: number
  readonly fiftyTwoWeekHigh: number
  readonly fiftyTwoWeekLow: number
  readonly per: number | null
  readonly pbr: number | null
  readonly eps: number | null
  readonly dividendYield: number | null
  readonly foreignRate: number | null
}

export interface HistoricalData {
  readonly date: string
  readonly open: number
  readonly high: number
  readonly low: number
  readonly close: number
  readonly volume: number
}

export interface MarketIndex {
  readonly name: string
  readonly value: number
  readonly change: number
  readonly changePercent: number
}

function parseKoreanNumber(value: string | undefined | null): number {
  if (!value) return 0
  return Number(value.replace(/,/g, "")) || 0
}

function parseMarketCap(value: string | undefined | null): number {
  if (!value) return 0
  const cleaned = value.replace(/,/g, "")
  const joMatch = cleaned.match(/([\d.]+)조/)
  const eokMatch = cleaned.match(/([\d.]+)억/)
  let total = 0
  if (joMatch) total += parseFloat(joMatch[1]) * 1_000_000_000_000
  if (eokMatch) total += parseFloat(eokMatch[1]) * 100_000_000
  return total
}

function findTotalInfoValue(
  totalInfos: Array<{ code: string; value: string }>,
  code: string
): string | undefined {
  return totalInfos.find((i) => i.code === code)?.value
}

export async function getQuote(ticker: string): Promise<StockQuote | null> {
  const cacheKey = `naver:quote:${ticker}`
  const cached = cache.get<StockQuote>(cacheKey)
  if (cached) return cached

  try {
    const [basicRes, integrationRes] = await Promise.all([
      fetch(`${NAVER_STOCK_API}/stock/${ticker}/basic`, { headers: HEADERS }),
      fetch(`${NAVER_STOCK_API}/stock/${ticker}/integration`, { headers: HEADERS }),
    ])

    if (!basicRes.ok) return null

    const basic = await basicRes.json()
    const integration = integrationRes.ok ? await integrationRes.json() : null
    const totalInfos = integration?.totalInfos ?? []

    const price = parseKoreanNumber(basic.closePrice)
    const change = parseKoreanNumber(basic.compareToPreviousClosePrice)
    const changePercent = parseFloat(basic.fluctuationsRatio) || 0

    const previousClose = parseKoreanNumber(findTotalInfoValue(totalInfos, "lastClosePrice"))
    const dayHigh = parseKoreanNumber(findTotalInfoValue(totalInfos, "highPrice"))
    const dayLow = parseKoreanNumber(findTotalInfoValue(totalInfos, "lowPrice"))
    const volume = parseKoreanNumber(findTotalInfoValue(totalInfos, "accumulatedTradingVolume"))
    const marketCapStr = findTotalInfoValue(totalInfos, "marketValue")
    const marketCap = parseMarketCap(marketCapStr)
    const foreignRateStr = findTotalInfoValue(totalInfos, "foreignRate")
    const foreignRate = foreignRateStr ? parseFloat(foreignRateStr.replace("%", "")) : null

    const perStr = findTotalInfoValue(totalInfos, "per")
    const pbrStr = findTotalInfoValue(totalInfos, "pbr")
    const epsStr = findTotalInfoValue(totalInfos, "eps")
    const dividendYieldStr = findTotalInfoValue(totalInfos, "dividendYieldRatio") ?? findTotalInfoValue(totalInfos, "dividendYield")

    const high52 = parseKoreanNumber(findTotalInfoValue(totalInfos, "high52wPrice"))
    const low52 = parseKoreanNumber(findTotalInfoValue(totalInfos, "low52wPrice"))

    const quote: StockQuote = {
      ticker,
      name: basic.stockName ?? ticker,
      price,
      change,
      changePercent,
      volume,
      marketCap,
      previousClose: previousClose || (price - change),
      dayHigh: dayHigh || price,
      dayLow: dayLow || price,
      fiftyTwoWeekHigh: high52 || price,
      fiftyTwoWeekLow: low52 || price,
      per: perStr ? parseFloat(perStr.replace(/,/g, "")) || null : null,
      pbr: pbrStr ? parseFloat(pbrStr.replace(/,/g, "")) || null : null,
      eps: epsStr ? parseKoreanNumber(epsStr) || null : null,
      dividendYield: dividendYieldStr ? parseFloat(dividendYieldStr.replace("%", "")) || null : null,
      foreignRate,
    }

    cache.set(cacheKey, quote, FIVE_MINUTES)
    return quote
  } catch (error) {
    console.error(`Failed to fetch Naver quote for ${ticker}:`, error)
    return null
  }
}

export async function getHistorical(
  ticker: string,
  period: "1mo" | "3mo" | "6mo" | "1y" | "3y" = "3mo"
): Promise<HistoricalData[]> {
  const cacheKey = `naver:historical:${ticker}:${period}`
  const cached = cache.get<HistoricalData[]>(cacheKey)
  if (cached) return cached

  try {
    const count = periodToCount(period)
    const timeframe = period === "3y" ? "week" : "day"

    const endDate = formatDateCompact(new Date())
    const startDate = formatDateCompact(getStartDate(period))

    const url = `${NAVER_CHART_API}?symbol=${ticker}&requestType=1&startTime=${startDate}&endTime=${endDate}&timeframe=${timeframe}&count=${count}`

    const res = await fetch(url, { headers: HEADERS })
    const text = await res.text()

    const data = parseChartResponse(text)

    cache.set(cacheKey, data, ONE_HOUR)
    return data
  } catch (error) {
    console.error(`Failed to fetch Naver historical for ${ticker}:`, error)
    return []
  }
}

export async function getMarketIndices(): Promise<MarketIndex[]> {
  const cacheKey = "naver:market:indices"
  const cached = cache.get<MarketIndex[]>(cacheKey)
  if (cached) return cached

  const indices = [
    { code: "KOSPI", name: "KOSPI" },
    { code: "KOSDAQ", name: "KOSDAQ" },
  ]

  const results: MarketIndex[] = []

  for (const { code, name } of indices) {
    try {
      const res = await fetch(`${NAVER_STOCK_API}/index/${code}/basic`, {
        headers: HEADERS,
      })
      if (!res.ok) continue
      const data = await res.json()

      results.push({
        name,
        value: parseKoreanNumber(data.closePrice),
        change: parseKoreanNumber(data.compareToPreviousClosePrice),
        changePercent: parseFloat(data.fluctuationsRatio) || 0,
      })
    } catch {
      results.push({ name, value: 0, change: 0, changePercent: 0 })
    }
  }

  try {
    const res = await fetch(`${NAVER_MARKETINDEX_API}/FX_USDKRW`, {
      headers: HEADERS,
    })
    if (res.ok) {
      const data = await res.json()
      const info = data.exchangeInfo
      results.push({
        name: "USD/KRW",
        value: parseKoreanNumber(info?.closePrice),
        change: parseKoreanNumber(info?.fluctuations),
        changePercent: parseFloat(info?.fluctuationsRatio) || 0,
      })
    }
  } catch {
    results.push({ name: "USD/KRW", value: 0, change: 0, changePercent: 0 })
  }

  cache.set(cacheKey, results, FIVE_MINUTES)
  return results
}

export async function getMultipleQuotes(
  tickers: string[]
): Promise<StockQuote[]> {
  const results = await Promise.all(tickers.map(getQuote))
  return results.filter((q): q is StockQuote => q !== null)
}

function parseChartResponse(text: string): HistoricalData[] {
  const rows = text
    .trim()
    .split("\n")
    .filter((line) => line.includes("[") && line.includes("]"))

  return rows
    .map((row) => {
      const match = row.match(
        /\["(\d{8})",\s*([\d.]+),\s*([\d.]+),\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)/
      )
      if (!match) return null

      const [, dateStr, open, high, low, close, volume] = match
      return {
        date: `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`,
        open: Number(open),
        high: Number(high),
        low: Number(low),
        close: Number(close),
        volume: Number(volume),
      }
    })
    .filter((d): d is HistoricalData => d !== null && d.close > 0)
}

function periodToCount(period: string): number {
  switch (period) {
    case "1mo": return 22
    case "3mo": return 66
    case "6mo": return 132
    case "1y": return 252
    case "3y": return 156
    default: return 66
  }
}

function getStartDate(period: string): Date {
  const now = new Date()
  switch (period) {
    case "1mo": now.setMonth(now.getMonth() - 1); break
    case "3mo": now.setMonth(now.getMonth() - 3); break
    case "6mo": now.setMonth(now.getMonth() - 6); break
    case "1y": now.setFullYear(now.getFullYear() - 1); break
    case "3y": now.setFullYear(now.getFullYear() - 3); break
  }
  return now
}

function formatDateCompact(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}${m}${d}`
}
