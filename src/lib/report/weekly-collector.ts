/**
 * 주간 보고서 데이터 수집 오케스트레이터
 * 5 영업일 집계 데이터를 수집하여 WeeklyRawData를 생성한다.
 */

import { getHistorical, getMarketIndices } from "@/lib/api/naver-finance"
import { getConsensus } from "@/lib/api/naver-consensus"
import { getInvestorFlow } from "@/lib/api/naver-investor"
import { getNaverNews } from "@/lib/api/naver-news"
import { getGoogleNews } from "@/lib/api/google-news"
import { calculateTechnicalIndicators } from "@/lib/analysis/technical"
import { analyzeNewsSentiment } from "@/lib/analysis/sentiment"
import { getFearGreedIndex } from "@/lib/api/fear-greed"
import { resolveTickerNames } from "@/lib/chat/data-fetcher"
import type { HistoricalData } from "@/lib/api/naver-finance"
import type { NewsArticle } from "@/lib/api/news-types"
import type { ReportProgress } from "./types"
import type {
  WeeklyRawData,
  WeeklyStockData,
  WeeklyMarketData,
  WeeklyIndexChange,
  ConsensusSnapshot,
} from "./weekly-types"

const MAX_STOCKS = 10
const TRADING_DAYS_PER_WEEK = 5
const MAX_NEWS_PER_STOCK = 15

function settled<T>(result: PromiseSettledResult<T>, fallback: T): T {
  return result.status === "fulfilled" ? result.value : fallback
}

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

/**
 * 최근 5 영업일 데이터를 히스토리컬에서 추출한다.
 * open = 첫 거래일 시가, close = 마지막 거래일 종가
 * high = 기간 최고가, low = 기간 최저가, volume = 기간 합산
 */
function extractWeekAggregates(historical: readonly HistoricalData[]): {
  readonly weekOpen: number
  readonly weekClose: number
  readonly weekChange: number
  readonly weekChangePercent: number
  readonly weekHigh: number
  readonly weekLow: number
  readonly weekVolume: number
  readonly weekDays: readonly HistoricalData[]
} | null {
  if (historical.length < TRADING_DAYS_PER_WEEK) return null

  const weekDays = historical.slice(-TRADING_DAYS_PER_WEEK)
  const weekOpen = weekDays[0].open
  const weekClose = weekDays[weekDays.length - 1].close
  const weekChange = weekClose - weekOpen
  const weekChangePercent = weekOpen > 0
    ? Number(((weekChange / weekOpen) * 100).toFixed(2))
    : 0
  const weekHigh = Math.max(...weekDays.map((d) => d.high))
  const weekLow = Math.min(...weekDays.map((d) => d.low))
  const weekVolume = weekDays.reduce((sum, d) => sum + d.volume, 0)

  return {
    weekOpen,
    weekClose,
    weekChange,
    weekChangePercent,
    weekHigh,
    weekLow,
    weekVolume,
    weekDays,
  }
}

function toConsensusSnapshot(
  consensus: Awaited<ReturnType<typeof getConsensus>>
): ConsensusSnapshot | null {
  if (!consensus) return null
  return {
    targetPrice: consensus.consensus.targetPrice,
    investmentOpinion: consensus.consensus.investmentOpinion,
    analystCount: consensus.consensus.analystCount,
  }
}

/** 개별 종목 주간 데이터 수집 */
async function collectWeeklyStockData(
  ticker: string,
  stockName: string
): Promise<WeeklyStockData> {
  const [
    historical,
    consensus,
    investorFlow,
    naverNews,
    googleNews,
  ] = await Promise.allSettled([
    getHistorical(ticker, "1mo"),
    getConsensus(ticker),
    getInvestorFlow(ticker),
    getNaverNews(stockName),
    getGoogleNews(stockName),
  ])

  const hist = settled(historical, [] as HistoricalData[])
  const weekAgg = extractWeekAggregates(hist)

  // 투자자 수급 5일 합산
  const flow = settled(investorFlow, { ticker, entries: [] })
  const recentEntries = flow.entries.slice(0, TRADING_DAYS_PER_WEEK)
  const weekForeignNet = recentEntries.reduce((sum, e) => sum + e.foreignNet, 0)
  const weekInstitutionNet = recentEntries.reduce((sum, e) => sum + e.institutionNet, 0)

  // 컨센서스 스냅샷 (현재 시점만 제공 가능)
  const consensusData = settled(consensus, null)
  const consensusEnd = toConsensusSnapshot(consensusData)

  // 뉴스 병합 및 중복 제거
  const nNews = settled(naverNews, [] as readonly NewsArticle[])
  const gNews = settled(googleNews, [] as readonly NewsArticle[])
  const news = mergeNews(nNews, gNews).slice(0, MAX_NEWS_PER_STOCK)

  // 기술적 지표 계산
  let technical = null
  if (hist.length > 0) {
    technical = calculateTechnicalIndicators(
      hist.map((h) => ({ close: h.close, high: h.high, low: h.low, volume: h.volume }))
    )
  }

  // 뉴스 감성 분석
  const sentiment = news.length > 0 ? analyzeNewsSentiment(news) : null

  return {
    ticker,
    name: stockName,
    weekOpen: weekAgg?.weekOpen ?? 0,
    weekClose: weekAgg?.weekClose ?? 0,
    weekChange: weekAgg?.weekChange ?? 0,
    weekChangePercent: weekAgg?.weekChangePercent ?? 0,
    weekHigh: weekAgg?.weekHigh ?? 0,
    weekLow: weekAgg?.weekLow ?? 0,
    weekVolume: weekAgg?.weekVolume ?? 0,
    weekForeignNet,
    weekInstitutionNet,
    consensusStart: null, // 주초 스냅샷은 별도 저장 필요 — 현재는 미제공
    consensusEnd,
    currentConviction: null, // Phase 2 분석 단계에서 AI가 판단
    technical,
    sentiment,
    news,
  }
}

/** 시장 컨텍스트 주간 데이터 수집 */
async function collectWeeklyMarketContext(): Promise<WeeklyMarketData> {
  const [indices, fearGreed] = await Promise.allSettled([
    getMarketIndices(),
    getFearGreedIndex(),
  ])

  const marketIndices = settled(indices, [])
  const fearGreedData = settled(fearGreed, null)

  // 지수별 주간 변동 (현재 시점 데이터 기준)
  const weeklyIndices: WeeklyIndexChange[] = marketIndices.map((idx) => ({
    name: idx.name,
    weekOpen: idx.value - idx.change,
    weekClose: idx.value,
    weekChange: idx.change,
    weekChangePercent: idx.changePercent,
    weekHigh: idx.value, // 일간 데이터만 제공되므로 현재가 사용
    weekLow: idx.value,
  }))

  return {
    indices: weeklyIndices,
    sectorPerformance: [], // 별도 섹터 API 연동 시 확장
    macroEvents: [],
    fearGreedStart: null, // 주초 스냅샷은 별도 저장 필요
    fearGreedEnd: fearGreedData?.score ?? null,
  }
}

/** 주간 데이터 수집 파이프라인 */
export async function collectWeeklyData(
  tickers: readonly string[],
  onProgress?: (p: ReportProgress) => void
): Promise<WeeklyRawData> {
  const limitedTickers = tickers.slice(0, MAX_STOCKS)

  onProgress?.({ phase: "collecting", progress: 5, message: "종목명 확인 중..." })

  const nameMap = await resolveTickerNames(limitedTickers)

  onProgress?.({ phase: "collecting", progress: 10, message: "주간 시장 데이터 수집 중..." })

  // 시장 데이터와 종목 데이터 병렬 수집
  const marketPromise = collectWeeklyMarketContext()

  const stockPromises = limitedTickers.map(async (ticker, i) => {
    const name = nameMap.get(ticker) ?? ticker
    const result = await collectWeeklyStockData(ticker, name)
    const pct = 10 + Math.round(((i + 1) / limitedTickers.length) * 30)
    onProgress?.({
      phase: "collecting",
      progress: pct,
      message: `${name} 주간 데이터 수집 완료 (${i + 1}/${limitedTickers.length})`,
    })
    return result
  })

  const [market, ...stocks] = await Promise.all([marketPromise, ...stockPromises])

  onProgress?.({ phase: "collecting", progress: 40, message: "주간 데이터 수집 완료" })

  const now = new Date()
  const weekEnd = now.toISOString().slice(0, 10)

  // 주 시작일 계산 (현재로부터 7일 전)
  const weekStartDate = new Date(now)
  weekStartDate.setDate(weekStartDate.getDate() - 6)
  const weekStart = weekStartDate.toISOString().slice(0, 10)

  return {
    weekStart,
    weekEnd,
    generatedAt: now.toISOString(),
    market,
    stocks,
  }
}
