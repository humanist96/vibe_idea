/**
 * 채팅용 데이터 페처 — 기존 API 함수를 직접 호출하여 데이터를 수집한다.
 * 내부 서버 함수를 직접 호출하므로 HTTP 오버헤드 없음.
 */

import { getQuote, getMarketIndices } from "@/lib/api/naver-finance"
import { getAIScore } from "@/lib/ai/scoring"
import type { StockQuote } from "@/lib/api/naver-finance"
import type { AIScore } from "@/lib/ai/score-schema"
import {
  ensureLoaded as ensureStockRegistry,
  findStock,
  searchStocks,
} from "@/lib/data/stock-registry"

export interface StockData {
  readonly quote: StockQuote | null
  readonly aiScore: AIScore | null
}

export interface SearchResult {
  readonly ticker: string
  readonly name: string
  readonly market: string
}

/** 종목명 또는 티커로 검색 */
export async function resolveStock(
  query: string
): Promise<SearchResult | null> {
  await ensureStockRegistry()

  // 정확히 숫자 6자리면 티커로 직접 검색
  if (/^\d{6}$/.test(query.trim())) {
    const stock = findStock(query.trim())
    if (stock) {
      return { ticker: stock.ticker, name: stock.name, market: stock.market }
    }
  }

  // 종목명 검색
  const results = searchStocks(query.trim())
  if (results.length > 0) {
    const top = results[0]
    return { ticker: top.ticker, name: top.name, market: top.market }
  }

  return null
}

/** 종목 기본 시세 + AI 스코어 조회 */
export async function fetchStockData(ticker: string): Promise<StockData> {
  const [quote, aiScore] = await Promise.allSettled([
    getQuote(ticker),
    getAIScore(ticker),
  ])

  return {
    quote: quote.status === "fulfilled" ? quote.value : null,
    aiScore: aiScore.status === "fulfilled" ? aiScore.value : null,
  }
}

/** 여러 종목 일괄 시세 조회 */
export async function fetchMultipleStockData(
  tickers: readonly string[]
): Promise<ReadonlyMap<string, StockData>> {
  const entries = await Promise.all(
    tickers.map(async (ticker) => {
      const data = await fetchStockData(ticker)
      return [ticker, data] as const
    })
  )
  return new Map(entries)
}

/** 시장 지수 데이터 — getMarketIndices 직접 호출 (HTTP 오버헤드 없음) */
export async function fetchMarketOverview(): Promise<{
  readonly kospi: { readonly price: number; readonly change: number; readonly changePercent: number } | null
  readonly kosdaq: { readonly price: number; readonly change: number; readonly changePercent: number } | null
  readonly usdKrw: { readonly price: number; readonly change: number; readonly changePercent: number } | null
}> {
  try {
    const indices = await getMarketIndices()
    const find = (name: string) => {
      const idx = indices.find((i) => i.name === name)
      if (!idx) return null
      return { price: idx.value, change: idx.change, changePercent: idx.changePercent }
    }
    return {
      kospi: find("KOSPI"),
      kosdaq: find("KOSDAQ"),
      usdKrw: find("USD/KRW"),
    }
  } catch {
    return { kospi: null, kosdaq: null, usdKrw: null }
  }
}

/** 티커 배열에서 종목 이름 맵 생성 */
export async function resolveTickerNames(
  tickers: readonly string[]
): Promise<ReadonlyMap<string, string>> {
  await ensureStockRegistry()
  const entries = tickers.map((t) => {
    const stock = findStock(t)
    return [t, stock?.name ?? t] as const
  })
  return new Map(entries)
}
