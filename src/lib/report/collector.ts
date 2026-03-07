/**
 * Phase 1: 데이터 수집 오케스트레이터
 * 관심종목 + 시장 데이터를 병렬로 수집하여 RawReportData를 생성한다.
 */

import { getQuote, getHistorical, getMarketIndices } from "@/lib/api/naver-finance"
import { getAIScore } from "@/lib/ai/scoring"
import { getConsensus } from "@/lib/api/naver-consensus"
import { getInvestorFlow } from "@/lib/api/naver-investor"
import { getInsiderActivities } from "@/lib/api/dart-insider"
import { getBlockHoldings } from "@/lib/api/dart-block-holdings"
import { getNaverNews } from "@/lib/api/naver-news"
import { getGoogleNews } from "@/lib/api/google-news"
import { getCorporateEvents } from "@/lib/api/dart-events"
import { getRanking } from "@/lib/api/naver-ranking"
import { getKoreanMacroOverview } from "@/lib/api/ecos"
import { getGlobalMacroOverview } from "@/lib/api/fred"
import { getFearGreedIndex } from "@/lib/api/fear-greed"
import { calculateTechnicalIndicators } from "@/lib/analysis/technical"
import { analyzeNewsSentiment } from "@/lib/analysis/sentiment"
import { resolveTickerNames } from "@/lib/chat/data-fetcher"
import type { RawReportData, StockReportData, MarketContextData, ReportProgress } from "./types"
import type { NewsArticle } from "@/lib/api/news-types"

const MAX_STOCKS = 10

function mergeNews(
  naverNews: readonly NewsArticle[],
  googleNews: readonly NewsArticle[]
): readonly NewsArticle[] {
  const seen = new Set<string>()
  const merged: NewsArticle[] = []
  for (const article of [...naverNews, ...googleNews]) {
    const key = article.title.slice(0, 30)
    if (!seen.has(key)) {
      seen.add(key)
      merged.push(article)
    }
  }
  return merged
}

function settled<T>(result: PromiseSettledResult<T>, fallback: T): T {
  return result.status === "fulfilled" ? result.value : fallback
}

/** 개별 종목 데이터 수집 */
async function collectStockData(
  ticker: string,
  stockName: string
): Promise<StockReportData> {
  const [
    quote,
    historical,
    aiScore,
    consensus,
    investorFlow,
    insider,
    blockHoldings,
    naverNews,
    googleNews,
    events,
  ] = await Promise.allSettled([
    getQuote(ticker),
    getHistorical(ticker, "3mo"),
    getAIScore(ticker),
    getConsensus(ticker),
    getInvestorFlow(ticker),
    getInsiderActivities(ticker),
    getBlockHoldings(ticker),
    getNaverNews(stockName),
    getGoogleNews(stockName),
    getCorporateEvents(7),
  ])

  const nNews = settled(naverNews, [] as readonly NewsArticle[])
  const gNews = settled(googleNews, [] as readonly NewsArticle[])
  const news = mergeNews(nNews, gNews)

  const hist = settled(historical, [])
  let technical = null
  if (hist.length > 0) {
    technical = calculateTechnicalIndicators(
      hist.map((h) => ({ close: h.close, high: h.high, low: h.low, volume: h.volume }))
    )
  }

  const sentiment = news.length > 0 ? analyzeNewsSentiment(news) : null

  // 공시는 해당 종목만 필터
  const allEvents = settled(events, [])
  const stockEvents = allEvents.filter(
    (e) => e.stockCode === ticker
  )

  return {
    ticker,
    name: stockName,
    quote: settled(quote, null),
    historical: hist.slice(-5),
    investorFlow: settled(investorFlow, null),
    consensus: settled(consensus, null),
    insider: settled(insider, []),
    blockHoldings: settled(blockHoldings, []),
    news: news.slice(0, 10),
    events: stockEvents,
    technical,
    sentiment,
    aiScore: settled(aiScore, null),
  }
}

/** 시장 컨텍스트 데이터 수집 */
async function collectMarketContext(): Promise<MarketContextData> {
  const [indices, fearGreed, macroKr, macroGlobal, rankingUp, rankingDown] =
    await Promise.allSettled([
      getMarketIndices(),
      getFearGreedIndex(),
      getKoreanMacroOverview(),
      getGlobalMacroOverview(),
      getRanking("up", "KOSPI"),
      getRanking("down", "KOSPI"),
    ])

  return {
    indices: settled(indices, []),
    fearGreed: settled(fearGreed, null),
    macroKr: settled(macroKr, []),
    macroGlobal: settled(macroGlobal, []),
    topGainers: settled(rankingUp, { stocks: [], totalCount: 0 }).stocks.slice(0, 5),
    topLosers: settled(rankingDown, { stocks: [], totalCount: 0 }).stocks.slice(0, 5),
  }
}

/** 전체 데이터 수집 파이프라인 */
export async function collectReportData(
  tickers: readonly string[],
  onProgress?: (p: ReportProgress) => void
): Promise<RawReportData> {
  const limitedTickers = tickers.slice(0, MAX_STOCKS)

  onProgress?.({ phase: "collecting", progress: 5, message: "종목명 확인 중..." })

  const nameMap = await resolveTickerNames(limitedTickers)

  onProgress?.({ phase: "collecting", progress: 10, message: "시장 데이터 수집 중..." })

  // 시장 데이터와 종목 데이터 병렬 수집
  const marketPromise = collectMarketContext()

  const stockPromises = limitedTickers.map(async (ticker, i) => {
    const name = nameMap.get(ticker) ?? ticker
    const result = await collectStockData(ticker, name)
    const pct = 10 + Math.round(((i + 1) / limitedTickers.length) * 30)
    onProgress?.({
      phase: "collecting",
      progress: pct,
      message: `${name} 데이터 수집 완료 (${i + 1}/${limitedTickers.length})`,
    })
    return result
  })

  const [market, ...stocks] = await Promise.all([marketPromise, ...stockPromises])

  onProgress?.({ phase: "collecting", progress: 40, message: "데이터 수집 완료" })

  return {
    date: new Date().toISOString().slice(0, 10),
    generatedAt: new Date().toISOString(),
    market,
    stocks,
  }
}
