/**
 * Phase 1: US 보고서 데이터 수집 오케스트레이터
 * 관심종목 + 시장 데이터를 병렬로 수집하여 USRawReportData를 생성한다.
 */

import {
  getUSQuote,
  getUSCandle,
  getUSMetrics,
  getUSNews,
  getUSQuoteBatch,
} from "@/lib/api/finnhub"
import { getFearGreedIndex } from "@/lib/api/fear-greed"
import { getGlobalMacroOverview } from "@/lib/api/fred"
import { findUSStock } from "@/lib/data/us-stock-registry"
import { calculateTechnicalIndicators } from "@/lib/analysis/technical"
import type {
  USRawReportData,
  USStockReportData,
  USMarketContextData,
  USMarketIndex,
  USSectorPerformance,
} from "./us-types"

const MAX_STOCKS = 10

const US_INDEX_ETFS = [
  { symbol: "SPY", name: "S&P 500" },
  { symbol: "QQQ", name: "NASDAQ 100" },
  { symbol: "DIA", name: "Dow Jones" },
  { symbol: "IWM", name: "Russell 2000" },
]

const US_SECTOR_ETFS = [
  { symbol: "XLK", name: "Technology", nameKr: "기술" },
  { symbol: "XLF", name: "Financials", nameKr: "금융" },
  { symbol: "XLV", name: "Healthcare", nameKr: "헬스케어" },
  { symbol: "XLY", name: "Consumer Disc.", nameKr: "경기소비재" },
  { symbol: "XLP", name: "Consumer Staples", nameKr: "필수소비재" },
  { symbol: "XLC", name: "Communication", nameKr: "통신" },
  { symbol: "XLI", name: "Industrials", nameKr: "산업재" },
  { symbol: "XLE", name: "Energy", nameKr: "에너지" },
  { symbol: "XLU", name: "Utilities", nameKr: "유틸리티" },
  { symbol: "XLRE", name: "Real Estate", nameKr: "부동산" },
  { symbol: "XLB", name: "Materials", nameKr: "소재" },
]

function settled<T>(result: PromiseSettledResult<T>, fallback: T): T {
  return result.status === "fulfilled" ? result.value : fallback
}

/** 개별 종목 데이터 수집 */
async function collectStockData(symbol: string): Promise<USStockReportData> {
  const entry = findUSStock(symbol)

  const [quoteRes, metricsRes, candleRes, newsRes] = await Promise.allSettled([
    getUSQuote(symbol),
    getUSMetrics(symbol),
    getUSCandle(symbol, "D"),
    getUSNews(symbol, 7),
  ])

  const quote = settled(quoteRes, null)
  const metrics = settled(metricsRes, null)
  const candle = settled(candleRes, null)
  const news = settled(newsRes, [] as readonly { headline: string; source: string; datetime: number; url: string }[])

  // Build historical from candle data (last 60 days)
  const historical =
    candle && candle.s === "ok"
      ? candle.c.slice(-60).map((close, i) => {
          const offset = candle.c.length - 60
          const idx = Math.max(0, offset) + i
          return {
            date: new Date(candle.t[idx] * 1000).toISOString().slice(0, 10),
            close,
            volume: candle.v[idx] ?? 0,
          }
        })
      : []

  // Calculate technicals from candle data (need 50+ data points)
  let technical = null
  if (candle && candle.s === "ok" && candle.c.length >= 50) {
    const ohlcv = candle.c.map((c, i) => ({
      close: c,
      high: candle.h[i],
      low: candle.l[i],
      volume: candle.v[i],
    }))
    technical = calculateTechnicalIndicators(ohlcv)
  }

  const m = metrics?.metric

  return {
    symbol,
    name: entry?.name ?? symbol,
    nameKr: entry?.nameKr ?? entry?.name ?? symbol,
    sector: entry?.sector ?? "",
    sectorKr: entry?.sectorKr ?? "",
    quote: quote
      ? {
          price: quote.c,
          change: quote.d,
          changePercent: quote.dp,
          high: quote.h,
          low: quote.l,
          previousClose: quote.pc,
        }
      : null,
    metrics: {
      marketCap: m?.marketCapitalization ?? null,
      pe: m?.peAnnual ?? null,
      pb: m?.pbAnnual ?? null,
      eps: m?.epsAnnual ?? null,
      dividendYield: m?.dividendYieldIndicatedAnnual ?? null,
      beta: m?.beta ?? null,
      fiftyTwoWeekHigh: m?.["52WeekHigh"] ?? null,
      fiftyTwoWeekLow: m?.["52WeekLow"] ?? null,
      roe: m?.roeTTM ?? null,
    },
    historical,
    news: (news as readonly { headline: string; source: string; datetime: number; url: string }[])
      .slice(0, 5)
      .map((n) => ({
        headline: n.headline,
        source: n.source,
        datetime: n.datetime,
        url: n.url,
      })),
    technical,
  }
}

/** 시장 컨텍스트 데이터 수집 */
async function collectMarketContext(): Promise<USMarketContextData> {
  const indexSymbols = US_INDEX_ETFS.map((e) => e.symbol)
  const sectorSymbols = US_SECTOR_ETFS.map((e) => e.symbol)

  const [indexQuotes, sectorQuotes, fearGreed, macro] = await Promise.allSettled([
    getUSQuoteBatch(indexSymbols),
    getUSQuoteBatch(sectorSymbols),
    getFearGreedIndex(),
    getGlobalMacroOverview(),
  ])

  const indexMap = settled(indexQuotes, new Map())
  const sectorMap = settled(sectorQuotes, new Map())

  const indices: USMarketIndex[] = US_INDEX_ETFS.map((etf) => {
    const q = indexMap.get(etf.symbol)
    return {
      symbol: etf.symbol,
      name: etf.name,
      price: q?.c ?? 0,
      change: q?.d ?? 0,
      changePercent: q?.dp ?? 0,
    }
  })

  const sectors: USSectorPerformance[] = US_SECTOR_ETFS.map((etf) => {
    const q = sectorMap.get(etf.symbol)
    return {
      sector: etf.name,
      sectorKr: etf.nameKr,
      etf: etf.symbol,
      changePercent: q?.dp ?? 0,
    }
  })

  return {
    indices,
    fearGreed: settled(fearGreed, null),
    sectors,
    macro: settled(macro, []),
  }
}

/** 전체 데이터 수집 파이프라인 */
export async function collectUSReportData(
  symbols: readonly string[]
): Promise<USRawReportData> {
  const limited = symbols.slice(0, MAX_STOCKS)

  const [market, ...stocks] = await Promise.all([
    collectMarketContext(),
    ...limited.map((s) => collectStockData(s.toUpperCase())),
  ])

  return {
    date: new Date().toISOString().slice(0, 10),
    generatedAt: new Date().toISOString(),
    market,
    stocks,
  }
}
