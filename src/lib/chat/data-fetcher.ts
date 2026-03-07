/**
 * 채팅용 데이터 페처 — 기존 API 함수를 직접 호출하여 데이터를 수집한다.
 * 내부 서버 함수를 직접 호출하므로 HTTP 오버헤드 없음.
 */

import { getQuote, getMarketIndices, getHistorical } from "@/lib/api/naver-finance"
import { getAIScore } from "@/lib/ai/scoring"
import { getConsensus } from "@/lib/api/naver-consensus"
import { getInvestorFlow } from "@/lib/api/naver-investor"
import { getFinanceAnnual } from "@/lib/api/naver-finance-detail"
import { getDividendInfo } from "@/lib/api/dart-dividend"
import { getInsiderActivities } from "@/lib/api/dart-insider"
import { getBlockHoldings } from "@/lib/api/dart-block-holdings"
import { getNaverNews } from "@/lib/api/naver-news"
import { getGoogleNews } from "@/lib/api/google-news"
import { getRanking } from "@/lib/api/naver-ranking"
import { getThemeList, getThemeStocks } from "@/lib/api/naver-theme"
import { getCorporateEvents } from "@/lib/api/dart-events"
import { getKoreanMacroOverview } from "@/lib/api/ecos"
import { getGlobalMacroOverview } from "@/lib/api/fred"
import {
  calculateTechnicalIndicators,
  getTechnicalScore,
} from "@/lib/analysis/technical"
import type { StockQuote } from "@/lib/api/naver-finance"
import type { AIScore } from "@/lib/ai/score-schema"
import type { ConsensusData } from "@/lib/api/naver-consensus"
import type { InvestorFlow } from "@/lib/api/naver-investor-types"
import type { FinanceData } from "@/lib/api/naver-finance-detail"
import type { DividendInfo } from "@/lib/api/dart-dividend-types"
import type { InsiderActivity } from "@/lib/api/dart-insider-types"
import type { BlockHolding } from "@/lib/api/dart-block-holdings-types"
import type { NewsArticle } from "@/lib/api/news-types"
import type { TechnicalIndicators } from "@/lib/analysis/technical"
import type { RankingResult } from "@/lib/api/naver-ranking"
import type { Theme, ThemeStockResult } from "@/lib/api/naver-theme"
import type { CorporateEvent } from "@/lib/api/dart-events-types"
import type { MacroIndicator } from "@/lib/api/ecos-types"
import type { GlobalMacroIndicator } from "@/lib/api/fred-types"
import { getFinanceQuarter } from "@/lib/api/naver-finance-detail"
import { getIpoList } from "@/lib/api/ipo-38comm"
import { analyzeEarningsSurprise } from "@/lib/analysis/earnings-surprise"
import { getSectorPerformances } from "@/lib/analysis/sector-rotation"
import { getProgramTrading } from "@/lib/api/naver-program"
import { getShortSelling } from "@/lib/api/naver-short-selling"
import { getFearGreedIndex } from "@/lib/api/fear-greed"
import type { IpoItem } from "@/lib/api/ipo-38comm"
import type { EarningsSurpriseResult } from "@/lib/analysis/earnings-surprise"
import type { SectorPerformance } from "@/lib/analysis/sector-rotation"
import type { ProgramTradingData } from "@/lib/api/naver-program"
import type { ShortSellingData } from "@/lib/api/naver-short-selling"
import type { FearGreedData } from "@/lib/api/fear-greed"
import {
  ensureLoaded as ensureStockRegistry,
  findStock,
  searchStocks,
} from "@/lib/data/stock-registry"

// ── Basic types (기존) ──────────────────────────────────────────

export interface StockData {
  readonly quote: StockQuote | null
  readonly aiScore: AIScore | null
}

export interface SearchResult {
  readonly ticker: string
  readonly name: string
  readonly market: string
}

// ── Enhanced types (신규) ───────────────────────────────────────

export interface EnhancedStockData {
  readonly quote: StockQuote | null
  readonly aiScore: AIScore | null
  readonly consensus: ConsensusData | null
  readonly investorFlow: InvestorFlow | null
  readonly financials: FinanceData | null
  readonly dividend: DividendInfo | null
  readonly insider: readonly InsiderActivity[]
  readonly blockHoldings: readonly BlockHolding[]
  readonly news: readonly NewsArticle[]
  readonly technicals: TechnicalIndicators | null
  readonly technicalScore: number | null
  readonly earningsSurprise: EarningsSurpriseResult | null
  readonly programTrading: ProgramTradingData | null
  readonly shortSelling: ShortSellingData | null
}

export interface EnhancedMarketData {
  readonly indices: {
    readonly kospi: { readonly price: number; readonly change: number; readonly changePercent: number } | null
    readonly kosdaq: { readonly price: number; readonly change: number; readonly changePercent: number } | null
    readonly usdKrw: { readonly price: number; readonly change: number; readonly changePercent: number } | null
  }
  readonly rankingUp: RankingResult | null
  readonly rankingDown: RankingResult | null
  readonly themes: readonly Theme[]
  readonly koreanMacro: readonly MacroIndicator[]
  readonly globalMacro: readonly GlobalMacroIndicator[]
  readonly events: readonly CorporateEvent[]
  readonly fearGreed: FearGreedData | null
}

// ── 기존 함수 (유지) ────────────────────────────────────────────

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

// ── 신규 함수 ───────────────────────────────────────────────────

/** 뉴스를 병합하고 중복 제거 */
function mergeAndDeduplicateNews(
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

/** 종목 종합 데이터 수집 — 14개 API 동시 호출 */
export async function fetchComprehensiveStockData(
  ticker: string,
  stockName: string
): Promise<EnhancedStockData> {
  const [
    quote,
    aiScore,
    consensus,
    investorFlow,
    financials,
    dividend,
    insider,
    blockHoldings,
    naverNews,
    googleNews,
    historical,
    quarterData,
    programTradingRes,
    shortSellingRes,
  ] = await Promise.allSettled([
    getQuote(ticker),
    getAIScore(ticker),
    getConsensus(ticker),
    getInvestorFlow(ticker),
    getFinanceAnnual(ticker),
    getDividendInfo(ticker),
    getInsiderActivities(ticker),
    getBlockHoldings(ticker),
    getNaverNews(stockName),
    getGoogleNews(stockName),
    getHistorical(ticker, "3mo"),
    getFinanceQuarter(ticker),
    getProgramTrading(ticker),
    getShortSelling(ticker),
  ])

  const nNews = naverNews.status === "fulfilled" ? naverNews.value : []
  const gNews = googleNews.status === "fulfilled" ? googleNews.value : []
  const news = mergeAndDeduplicateNews(nNews, gNews)

  const hist = historical.status === "fulfilled" ? historical.value : []
  let technicals: TechnicalIndicators | null = null
  let technicalScore: number | null = null
  if (hist.length > 0) {
    technicals = calculateTechnicalIndicators(
      hist.map((h) => ({ close: h.close, high: h.high, low: h.low, volume: h.volume }))
    )
    technicalScore = getTechnicalScore(technicals)
  }

  const qData = quarterData.status === "fulfilled" ? quarterData.value : null
  const earningsSurprise = qData ? analyzeEarningsSurprise(qData, ticker) : null

  return {
    quote: quote.status === "fulfilled" ? quote.value : null,
    aiScore: aiScore.status === "fulfilled" ? aiScore.value : null,
    consensus: consensus.status === "fulfilled" ? consensus.value : null,
    investorFlow: investorFlow.status === "fulfilled" ? investorFlow.value : null,
    financials: financials.status === "fulfilled" ? financials.value : null,
    dividend: dividend.status === "fulfilled" ? dividend.value : null,
    insider: insider.status === "fulfilled" ? insider.value : [],
    blockHoldings: blockHoldings.status === "fulfilled" ? blockHoldings.value : [],
    news,
    technicals,
    technicalScore,
    earningsSurprise,
    programTrading: programTradingRes.status === "fulfilled" ? programTradingRes.value : null,
    shortSelling: shortSellingRes.status === "fulfilled" ? shortSellingRes.value : null,
  }
}

/** IPO 목록 조회 */
export async function fetchIpoData(): Promise<readonly IpoItem[]> {
  try {
    return await getIpoList()
  } catch {
    return []
  }
}

/** 섹터 성과 데이터 조회 */
export async function fetchSectorData(): Promise<readonly SectorPerformance[]> {
  try {
    return await getSectorPerformances()
  } catch {
    return []
  }
}

/** 시장 종합 데이터 수집 — 8개 API 동시 호출 */
export async function fetchEnhancedMarketOverview(): Promise<EnhancedMarketData> {
  const [indices, rankingUp, rankingDown, themes, koreanMacro, globalMacro, events, fearGreedRes] =
    await Promise.allSettled([
      fetchMarketOverview(),
      getRanking("up", "KOSPI"),
      getRanking("down", "KOSPI"),
      getThemeList(),
      getKoreanMacroOverview(),
      getGlobalMacroOverview(),
      getCorporateEvents(7),
      getFearGreedIndex(),
    ])

  return {
    indices: indices.status === "fulfilled"
      ? indices.value
      : { kospi: null, kosdaq: null, usdKrw: null },
    rankingUp: rankingUp.status === "fulfilled" ? rankingUp.value : null,
    rankingDown: rankingDown.status === "fulfilled" ? rankingDown.value : null,
    themes: themes.status === "fulfilled" ? themes.value : [],
    koreanMacro: koreanMacro.status === "fulfilled" ? koreanMacro.value : [],
    globalMacro: globalMacro.status === "fulfilled" ? globalMacro.value : [],
    events: events.status === "fulfilled" ? events.value : [],
    fearGreed: fearGreedRes.status === "fulfilled" ? fearGreedRes.value : null,
  }
}

/** 랭킹 데이터 수집 — KOSPI/KOSDAQ 상승·하락 4개 동시 호출 */
export async function fetchRankingData(): Promise<{
  readonly kospiUp: RankingResult | null
  readonly kospiDown: RankingResult | null
  readonly kosdaqUp: RankingResult | null
  readonly kosdaqDown: RankingResult | null
}> {
  const [kospiUp, kospiDown, kosdaqUp, kosdaqDown] = await Promise.allSettled([
    getRanking("up", "KOSPI"),
    getRanking("down", "KOSPI"),
    getRanking("up", "KOSDAQ"),
    getRanking("down", "KOSDAQ"),
  ])

  return {
    kospiUp: kospiUp.status === "fulfilled" ? kospiUp.value : null,
    kospiDown: kospiDown.status === "fulfilled" ? kospiDown.value : null,
    kosdaqUp: kosdaqUp.status === "fulfilled" ? kosdaqUp.value : null,
    kosdaqDown: kosdaqDown.status === "fulfilled" ? kosdaqDown.value : null,
  }
}

/** 매크로 데이터 수집 — ECOS + FRED 동시 호출 */
export async function fetchMacroData(): Promise<{
  readonly korean: readonly MacroIndicator[]
  readonly global: readonly GlobalMacroIndicator[]
}> {
  const [korean, global] = await Promise.allSettled([
    getKoreanMacroOverview(),
    getGlobalMacroOverview(),
  ])

  return {
    korean: korean.status === "fulfilled" ? korean.value : [],
    global: global.status === "fulfilled" ? global.value : [],
  }
}

/** 테마 데이터 수집 — 테마 목록 → 상위 5개 종목 상세 */
export async function fetchThemeData(): Promise<{
  readonly themes: readonly Theme[]
  readonly themeStocks: ReadonlyMap<string, ThemeStockResult>
}> {
  const themeList = await getThemeList().catch(() => [] as Theme[])

  const topThemes = [...themeList]
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
    .slice(0, 5)

  const stockResults = await Promise.allSettled(
    topThemes.map((theme) => getThemeStocks(theme.no, 1, 5))
  )

  const themeStocks = new Map<string, ThemeStockResult>()
  topThemes.forEach((theme, i) => {
    const result = stockResults[i]
    if (result.status === "fulfilled") {
      themeStocks.set(theme.no, result.value)
    }
  })

  return { themes: themeList, themeStocks }
}

/** 기업 공시 이벤트 데이터 수집 */
export async function fetchCorporateEventsData(
  days = 30
): Promise<readonly CorporateEvent[]> {
  try {
    return await getCorporateEvents(days)
  } catch {
    return []
  }
}

// ── US Stock Functions ──────────────────────────────────────

export interface USStockChatData {
  readonly symbol: string
  readonly name: string
  readonly nameKr: string | null
  readonly quote: {
    readonly price: number
    readonly change: number
    readonly changePercent: number
    readonly open: number
    readonly high: number
    readonly low: number
    readonly previousClose: number
  }
  readonly metrics: {
    readonly marketCap: number | null
    readonly pe: number | null
    readonly pb: number | null
    readonly eps: number | null
    readonly dividendYield: number | null
    readonly beta: number | null
    readonly fiftyTwoWeekHigh: number | null
    readonly fiftyTwoWeekLow: number | null
    readonly roe: number | null
  }
  readonly news: readonly { readonly headline: string; readonly source: string; readonly datetime: number }[]
  readonly earnings: readonly {
    readonly date: string
    readonly epsEstimate: number | null
    readonly epsActual: number | null
    readonly surprisePercent: number | null
  }[]
  readonly statistics: {
    readonly forwardPE: number | null
    readonly pegRatio: number | null
    readonly priceToSales: number | null
    readonly operatingMargin: number | null
    readonly profitMargin: number | null
    readonly revenueGrowthYoY: number | null
    readonly earningsGrowthYoY: number | null
    readonly shortRatio: number | null
  } | null
  readonly profile: {
    readonly description: string
    readonly sector: string
    readonly industry: string
    readonly ceo: string
    readonly employees: string
    readonly ipoDate: string
  } | null
  readonly dividendHistory: readonly { readonly exDate: string; readonly amount: number }[]
  readonly insiderTransactions: readonly {
    readonly name: string
    readonly transactionDate: string
    readonly transactionCode: string
    readonly share: number
    readonly change: number
    readonly transactionPrice: number
  }[]
  readonly technicals: TechnicalIndicators | null
  readonly technicalScore: number | null
}

/** 미국 종목 심볼 해석 */
export async function resolveUSStock(
  query: string
): Promise<{ readonly symbol: string; readonly name: string; readonly nameKr: string | null } | null> {
  const { findUSStock, searchUSStocks: searchUS } = await import("@/lib/data/us-stock-registry")

  const upper = query.toUpperCase().trim()
  const exact = findUSStock(upper)
  if (exact) return { symbol: exact.symbol, name: exact.name, nameKr: exact.nameKr }

  const results = searchUS(query, 1)
  if (results.length > 0) {
    return { symbol: results[0].symbol, name: results[0].name, nameKr: results[0].nameKr }
  }

  return null
}

/** 미국 종목 종합 데이터 수집 — 8개 API 동시 호출 */
export async function fetchUSStockData(symbol: string): Promise<USStockChatData | null> {
  try {
    const { getUSQuote, getUSMetrics, getUSNews, getUSInsiderTransactions, getUSCandle } = await import("@/lib/api/finnhub")
    const { getTwelveEarnings, getTwelveStatistics, getTwelveDividends } = await import("@/lib/api/twelve-data")
    const { getFmpProfile } = await import("@/lib/api/fmp")
    const { findUSStock } = await import("@/lib/data/us-stock-registry")

    const [quoteRes, metricsRes, newsRes, earningsRes, statsRes, profileRes, dividendsRes, insiderRes, candleRes] = await Promise.allSettled([
      getUSQuote(symbol),
      getUSMetrics(symbol),
      getUSNews(symbol, 5),
      getTwelveEarnings(symbol),
      getTwelveStatistics(symbol),
      getFmpProfile(symbol),
      getTwelveDividends(symbol),
      getUSInsiderTransactions(symbol),
      getUSCandle(symbol, "D"),
    ])

    const quote = quoteRes.status === "fulfilled" ? quoteRes.value : null
    if (!quote || quote.c === 0) return null

    const metrics = metricsRes.status === "fulfilled" ? metricsRes.value : null
    const news = newsRes.status === "fulfilled" ? newsRes.value : []
    const earnings = earningsRes.status === "fulfilled" ? earningsRes.value : null
    const stats = statsRes.status === "fulfilled" ? statsRes.value : null
    const profile = profileRes.status === "fulfilled" ? profileRes.value : null
    const dividends = dividendsRes.status === "fulfilled" ? dividendsRes.value : null
    const insiderTxs = insiderRes.status === "fulfilled" ? insiderRes.value : []
    const candle = candleRes.status === "fulfilled" ? candleRes.value : null
    const registry = findUSStock(symbol)

    // 기술적 지표 계산 (candle 데이터 기반)
    let technicals: TechnicalIndicators | null = null
    let technicalScore: number | null = null
    if (candle && candle.s === "ok" && candle.c.length > 20) {
      const ohlcv = candle.c.map((_, i) => ({
        close: candle.c[i],
        high: candle.h[i],
        low: candle.l[i],
        volume: candle.v[i],
      }))
      technicals = calculateTechnicalIndicators(ohlcv)
      technicalScore = getTechnicalScore(technicals)
    }

    // 통계 데이터 변환
    const statisticsData = stats ? {
      forwardPE: stats.statistics.valuations_metrics.forward_pe,
      pegRatio: stats.statistics.valuations_metrics.peg_ratio,
      priceToSales: stats.statistics.valuations_metrics.price_to_sales_ttm,
      operatingMargin: stats.statistics.financials.operating_margin_ttm,
      profitMargin: stats.statistics.financials.profit_margin,
      revenueGrowthYoY: stats.statistics.financials.quarterly_revenue_growth_yoy,
      earningsGrowthYoY: stats.statistics.financials.quarterly_earnings_growth_yoy,
      shortRatio: stats.statistics.stock_statistics.short_ratio,
    } : null

    // 프로필 데이터 변환
    const profileData = profile ? {
      description: profile.description.length > 200
        ? profile.description.slice(0, 200) + "..."
        : profile.description,
      sector: profile.sector,
      industry: profile.industry,
      ceo: profile.ceo,
      employees: profile.fullTimeEmployees,
      ipoDate: profile.ipoDate,
    } : null

    // 배당 이력 변환
    const dividendHistory = (dividends?.dividends ?? []).slice(0, 8).map((d) => ({
      exDate: d.ex_date,
      amount: d.amount,
    }))

    // 내부자 거래 변환
    const insiderTransactions = insiderTxs.slice(0, 5).map((tx) => ({
      name: tx.name,
      transactionDate: tx.transactionDate,
      transactionCode: tx.transactionCode,
      share: tx.share,
      change: tx.change,
      transactionPrice: tx.transactionPrice,
    }))

    return {
      symbol,
      name: registry?.name ?? symbol,
      nameKr: registry?.nameKr ?? null,
      quote: {
        price: quote.c,
        change: quote.d,
        changePercent: quote.dp,
        open: quote.o,
        high: quote.h,
        low: quote.l,
        previousClose: quote.pc,
      },
      metrics: {
        marketCap: metrics?.metric.marketCapitalization
          ? metrics.metric.marketCapitalization * 1_000_000
          : null,
        pe: metrics?.metric.peAnnual ?? null,
        pb: metrics?.metric.pbAnnual ?? null,
        eps: metrics?.metric.epsAnnual ?? null,
        dividendYield: metrics?.metric.dividendYieldIndicatedAnnual ?? null,
        beta: metrics?.metric.beta ?? null,
        fiftyTwoWeekHigh: metrics?.metric["52WeekHigh"] as number | undefined ?? null,
        fiftyTwoWeekLow: metrics?.metric["52WeekLow"] as number | undefined ?? null,
        roe: metrics?.metric.roeTTM as number | undefined ?? null,
      },
      news: news.slice(0, 5).map((n) => ({
        headline: n.headline,
        source: n.source,
        datetime: n.datetime,
      })),
      earnings: (earnings?.earnings ?? []).slice(0, 4).map((e) => ({
        date: e.date,
        epsEstimate: e.eps_estimate,
        epsActual: e.eps_actual,
        surprisePercent: e.surprise_prc,
      })),
      statistics: statisticsData,
      profile: profileData,
      dividendHistory,
      insiderTransactions,
      technicals,
      technicalScore,
    }
  } catch {
    return null
  }
}

/** 미국 시장 오버뷰 데이터 수집 */
export interface USMarketOverviewData {
  readonly indices: readonly {
    readonly symbol: string
    readonly name: string
    readonly price: number
    readonly change: number
    readonly changePercent: number
  }[]
  readonly topStocks: readonly {
    readonly symbol: string
    readonly name: string
    readonly nameKr: string
    readonly price: number
    readonly changePercent: number
  }[]
  readonly earnings: readonly {
    readonly symbol: string
    readonly date: string
    readonly epsEstimate: number | null
    readonly epsActual: number | null
  }[]
  readonly fearGreed: FearGreedData | null
}

export async function fetchUSMarketOverview(): Promise<USMarketOverviewData> {
  try {
    const { getUSQuoteBatch } = await import("@/lib/api/finnhub")
    const { getUSEarningsCalendar } = await import("@/lib/api/finnhub")
    const { getTopUSStocks, US_INDEX_SYMBOLS, getPopularETFs } = await import("@/lib/data/us-stock-registry")

    const topStocks = getTopUSStocks(10)
    const etfs = getPopularETFs()
    const allSymbols = [...US_INDEX_SYMBOLS, ...topStocks.map((s) => s.symbol)]

    const [quotesMap, earningsData, fearGreedRes] = await Promise.allSettled([
      getUSQuoteBatch(allSymbols),
      getUSEarningsCalendar(),
      getFearGreedIndex(),
    ])

    const quotes = quotesMap.status === "fulfilled" ? quotesMap.value : new Map()
    const earnings = earningsData.status === "fulfilled" ? earningsData.value : []

    const indices = US_INDEX_SYMBOLS.map((sym) => {
      const q = quotes.get(sym)
      const etf = etfs.find((e) => e.symbol === sym)
      return {
        symbol: sym,
        name: etf?.name ?? sym,
        price: q?.c ?? 0,
        change: q?.d ?? 0,
        changePercent: q?.dp ?? 0,
      }
    })

    const stocks = topStocks
      .map((stock) => {
        const q = quotes.get(stock.symbol)
        return {
          symbol: stock.symbol,
          name: stock.name,
          nameKr: stock.nameKr,
          price: q?.c ?? 0,
          changePercent: q?.dp ?? 0,
        }
      })
      .filter((s) => s.price > 0)

    return {
      indices,
      topStocks: stocks,
      earnings: earnings.slice(0, 10).map((e) => ({
        symbol: e.symbol,
        date: e.date,
        epsEstimate: e.epsEstimate,
        epsActual: e.epsActual,
      })),
      fearGreed: fearGreedRes.status === "fulfilled" ? fearGreedRes.value : null,
    }
  } catch {
    return { indices: [], topStocks: [], earnings: [], fearGreed: null }
  }
}

// ── US Extended Fetchers ─────────────────────────────────────

export interface USRankingChatData {
  readonly stocks: readonly {
    readonly rank: number
    readonly symbol: string
    readonly nameKr: string
    readonly price: number
    readonly changePercent: number
    readonly sector: string
  }[]
}

export async function fetchUSRankingData(type: "up" | "down" = "up"): Promise<USRankingChatData> {
  try {
    const { getUSQuoteBatch } = await import("@/lib/api/finnhub")
    const { getAllUSStocks, findUSStock } = await import("@/lib/data/us-stock-registry")

    const stocks = getAllUSStocks()
    const symbols = stocks.map((s) => s.symbol)
    const quotes = await getUSQuoteBatch(symbols)

    const ranked = symbols
      .map((symbol) => {
        const q = quotes.get(symbol)
        const entry = findUSStock(symbol)
        if (!q || !entry || q.c === 0) return null
        return { symbol, nameKr: entry.nameKr, price: q.c, changePercent: q.dp, sector: entry.sectorKr }
      })
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .sort((a, b) => type === "up" ? b.changePercent - a.changePercent : a.changePercent - b.changePercent)
      .slice(0, 15)
      .map((s, i) => ({ ...s, rank: i + 1 }))

    return { stocks: ranked }
  } catch {
    return { stocks: [] }
  }
}

export interface USThemeChatData {
  readonly themes: readonly {
    readonly nameKr: string
    readonly avgChange: number
    readonly stockCount: number
  }[]
}

export async function fetchUSThemeData(): Promise<USThemeChatData> {
  try {
    const { getUSQuoteBatch } = await import("@/lib/api/finnhub")
    const { US_THEMES } = await import("@/lib/data/us-theme-registry")

    const allSymbols = [...new Set(US_THEMES.flatMap((t) => t.symbols))]
    const quotes = await getUSQuoteBatch(allSymbols)

    const themes = US_THEMES.map((theme) => {
      const changes = theme.symbols
        .map((s) => quotes.get(s)?.dp ?? null)
        .filter((v): v is number => v !== null)
      const avg = changes.length > 0 ? changes.reduce((s, c) => s + c, 0) / changes.length : 0
      return { nameKr: theme.nameKr, avgChange: Math.round(avg * 100) / 100, stockCount: theme.symbols.length }
    })

    return { themes }
  } catch {
    return { themes: [] }
  }
}

export interface USSectorChatData {
  readonly sectors: readonly {
    readonly nameKr: string
    readonly symbol: string
    readonly return1M: number | null
    readonly return3M: number | null
  }[]
}

export async function fetchUSSectorData(): Promise<USSectorChatData> {
  try {
    const { getTwelveTimeSeries } = await import("@/lib/api/twelve-data")
    const { US_SECTOR_ETFS } = await import("@/lib/data/us-stock-registry")

    const results = await Promise.allSettled(
      US_SECTOR_ETFS.slice(0, 5).map(async (etf) => {
        const ts = await getTwelveTimeSeries(etf.symbol, "1day", 90)
        if (!ts || ts.values.length < 2) return null
        const latest = Number(ts.values[0].close)
        const m1 = ts.values[Math.min(21, ts.values.length - 1)]
        const m3 = ts.values[Math.min(63, ts.values.length - 1)]
        return {
          nameKr: etf.nameKr,
          symbol: etf.symbol,
          return1M: m1 ? ((latest - Number(m1.close)) / Number(m1.close)) * 100 : null,
          return3M: m3 ? ((latest - Number(m3.close)) / Number(m3.close)) * 100 : null,
        }
      })
    )

    return {
      sectors: results
        .filter((r): r is PromiseFulfilledResult<NonNullable<{ nameKr: string; symbol: string; return1M: number | null; return3M: number | null }>> =>
          r.status === "fulfilled" && r.value !== null
        )
        .map((r) => r.value),
    }
  } catch {
    return { sectors: [] }
  }
}

export interface USIPOChatData {
  readonly upcoming: readonly { readonly name: string; readonly date: string; readonly symbol: string }[]
  readonly recent: readonly { readonly name: string; readonly date: string; readonly symbol: string }[]
}

export async function fetchUSIPOData(): Promise<USIPOChatData> {
  try {
    const { getUSIPOCalendar } = await import("@/lib/api/finnhub")
    const events = await getUSIPOCalendar()
    const today = new Date().toISOString().slice(0, 10)

    return {
      upcoming: events
        .filter((e) => e.date >= today)
        .slice(0, 10)
        .map((e) => ({ name: e.name, date: e.date, symbol: e.symbol })),
      recent: events
        .filter((e) => e.date < today)
        .slice(0, 10)
        .map((e) => ({ name: e.name, date: e.date, symbol: e.symbol })),
    }
  } catch {
    return { upcoming: [], recent: [] }
  }
}

/** 여러 종목 컨센서스 일괄 조회 */
export async function fetchMultipleConsensus(
  tickers: readonly string[]
): Promise<ReadonlyMap<string, ConsensusData | null>> {
  const results = await Promise.allSettled(
    tickers.map((ticker) => getConsensus(ticker))
  )

  const entries = tickers.map((ticker, i) => {
    const result = results[i]
    return [ticker, result.status === "fulfilled" ? result.value : null] as const
  })

  return new Map(entries)
}
