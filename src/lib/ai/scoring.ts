import { cache, ONE_HOUR } from "@/lib/cache/memory-cache"
import { getQuote, getHistorical } from "@/lib/api/naver-finance"
import { getCompanyOverview, getFinancialStatements } from "@/lib/api/dart"
import { getNaverNews } from "@/lib/api/naver-news"
import { getGoogleNews } from "@/lib/api/google-news"
import { generateAIAnalysis } from "@/lib/api/gemini"
import {
  calculateTechnicalIndicators,
  getTechnicalScore,
} from "@/lib/analysis/technical"
import { getFundamentalScore } from "@/lib/analysis/fundamental"
import { analyzeNewsSentiment } from "@/lib/analysis/sentiment"
import {
  AIScoreSchema,
  getRatingFromScore,
  type AIScore,
  type Factor,
} from "./score-schema"
import { buildScoringPrompt, type PromptData } from "./prompts"
import {
  ensureLoaded,
  findStock as registryFindStock,
} from "@/lib/data/stock-registry"
import * as corpCodeRegistry from "@/lib/data/corp-code-registry"
import { findStock as fallbackFindStock } from "@/lib/constants/stocks"
import type { CompanyOverview, FinancialStatement } from "@/lib/api/dart"
import type { NewsArticle } from "@/lib/api/news-types"
import type { StockQuote, HistoricalData } from "@/lib/api/naver-finance"
import type { TechnicalIndicators } from "@/lib/analysis/technical"
import type { NewsSentiment } from "@/lib/api/news-types"

interface DataSources {
  readonly quote: boolean
  readonly technical: boolean
  readonly dart: boolean
  readonly financials: boolean
  readonly naverNews: boolean
  readonly googleNews: boolean
}

interface CollectedData {
  readonly quote: StockQuote | null
  readonly historical: readonly HistoricalData[]
  readonly companyInfo: CompanyOverview | null
  readonly financials: readonly FinancialStatement[]
  readonly naverNews: readonly NewsArticle[]
  readonly googleNews: readonly NewsArticle[]
  readonly sources: DataSources
}

async function fetchFinancialsWithFallback(
  corpCode: string
): Promise<readonly FinancialStatement[]> {
  const currentYear = new Date().getFullYear()
  for (const year of [currentYear - 1, currentYear - 2]) {
    const result = await getFinancialStatements(corpCode, String(year))
    if (result.length > 0) return result
  }
  return []
}

async function collectAllData(ticker: string, stockName: string): Promise<CollectedData> {
  await corpCodeRegistry.ensureLoaded()
  const corpCode = corpCodeRegistry.resolve(ticker)

  const [
    quoteResult,
    historicalResult,
    companyResult,
    financialsResult,
    naverNewsResult,
    googleNewsResult,
  ] = await Promise.allSettled([
    getQuote(ticker),
    getHistorical(ticker, "1y"),
    corpCode ? getCompanyOverview(corpCode) : Promise.resolve(null),
    corpCode ? fetchFinancialsWithFallback(corpCode) : Promise.resolve([]),
    getNaverNews(stockName),
    getGoogleNews(stockName),
  ])

  const quote = quoteResult.status === "fulfilled" ? quoteResult.value : null
  const historical = historicalResult.status === "fulfilled" ? historicalResult.value : []
  const companyInfo = companyResult.status === "fulfilled" ? companyResult.value : null
  const financials = financialsResult.status === "fulfilled" ? financialsResult.value : []
  const naverNews = naverNewsResult.status === "fulfilled" ? naverNewsResult.value : []
  const googleNews = googleNewsResult.status === "fulfilled" ? googleNewsResult.value : []

  return {
    quote,
    historical,
    companyInfo,
    financials,
    naverNews,
    googleNews,
    sources: {
      quote: quote !== null,
      technical: historical.length > 0,
      dart: companyInfo !== null,
      financials: financials.length > 0,
      naverNews: naverNews.length > 0,
      googleNews: googleNews.length > 0,
    },
  }
}

export async function getAIScore(ticker: string): Promise<AIScore | null> {
  const cacheKey = `ai-score:${ticker}`
  const cached = cache.get<AIScore>(cacheKey)
  if (cached) return cached

  await ensureLoaded()
  const stock = registryFindStock(ticker) ?? fallbackFindStock(ticker)
  if (!stock) return null

  try {
    const data = await collectAllData(stock.ticker, stock.name)

    if (!data.quote && data.historical.length === 0) {
      return generateFallbackScore(ticker, stock.name, null, undefined, null, data.sources)
    }

    const technicalIndicators =
      data.historical.length > 0
        ? calculateTechnicalIndicators(
            data.historical.map((h) => ({
              close: h.close,
              high: h.high,
              low: h.low,
              volume: h.volume,
            }))
          )
        : undefined

    const allNews = [...data.naverNews, ...data.googleNews]
    const newsSentiment = allNews.length > 0 ? analyzeNewsSentiment(allNews) : null
    const newsHeadlines = allNews.slice(0, 5).map((a) => a.title)

    try {
      const promptData: PromptData = {
        name: stock.name,
        ticker: stock.ticker,
        price: data.quote?.price ?? 0,
        changePercent: data.quote?.changePercent ?? 0,
        per: data.quote?.per ?? null,
        pbr: data.quote?.pbr ?? null,
        eps: data.quote?.eps ?? null,
        dividendYield: data.quote?.dividendYield ?? null,
        marketCap: data.quote?.marketCap ?? 0,
        volume: data.quote?.volume ?? 0,
        technicalIndicators: technicalIndicators ?? {
          rsi: 50, macdLine: 0, macdSignal: 0, macdHistogram: 0,
          sma20: 0, sma50: 0, sma200: 0, ema12: 0, ema26: 0,
          bollingerUpper: 0, bollingerMiddle: 0, bollingerLower: 0,
          atr: 0, priceVsSma20: 0, priceVsSma50: 0, priceVsSma200: 0,
          volumeRatio: 1,
        },
        sector: stock.sector,
        companyInfo: data.companyInfo,
        financials: data.financials,
        newsSentiment,
      }

      const prompt = buildScoringPrompt(promptData)
      const response = await generateAIAnalysis(prompt)

      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error("No JSON found in AI response")
      }

      const parsed = JSON.parse(jsonMatch[0])
      const score = AIScoreSchema.parse({
        ...parsed,
        dataSources: data.sources,
        newsHeadlines,
        analyzedAt: new Date().toISOString(),
      })

      cache.set(cacheKey, score, ONE_HOUR)
      return score
    } catch {
      return generateFallbackScore(
        ticker,
        stock.name,
        data.quote,
        technicalIndicators,
        newsSentiment,
        data.sources
      )
    }
  } catch (error) {
    console.error(`AI scoring failed for ${ticker}:`, error)
    return null
  }
}

function generateFallbackScore(
  ticker: string,
  stockName: string,
  quote: StockQuote | null | undefined,
  technicalIndicators?: TechnicalIndicators,
  newsSentiment?: NewsSentiment | null,
  dataSources?: DataSources
): AIScore {
  const techScore = technicalIndicators
    ? getTechnicalScore(technicalIndicators)
    : 5

  const fundScore = quote
    ? getFundamentalScore({
        per: quote.per,
        pbr: quote.pbr,
        eps: quote.eps,
        dividendYield: quote.dividendYield,
        marketCap: quote.marketCap,
        priceChange52w: quote.changePercent,
      })
    : 5

  const sentimentScore = newsSentiment ? newsSentiment.overallScore : 5
  const riskScore = 5

  const aiScore =
    Math.round(
      (techScore * 0.3 +
        fundScore * 0.3 +
        sentimentScore * 0.2 +
        riskScore * 0.2) *
        10
    ) / 10

  const factors: Factor[] = []

  if (technicalIndicators) {
    if (technicalIndicators.rsi < 30) {
      factors.push({ name: "RSI 과매도 구간", impact: "positive", strength: 4 })
    } else if (technicalIndicators.rsi > 70) {
      factors.push({ name: "RSI 과매수 구간", impact: "negative", strength: 4 })
    }

    if (technicalIndicators.macdHistogram > 0) {
      factors.push({ name: "MACD 상승 신호", impact: "positive", strength: 3 })
    } else {
      factors.push({ name: "MACD 하락 신호", impact: "negative", strength: 3 })
    }

    if (technicalIndicators.priceVsSma200 > 0) {
      factors.push({ name: "200일 이동평균 위 위치", impact: "positive", strength: 3 })
    } else {
      factors.push({ name: "200일 이동평균 아래 위치", impact: "negative", strength: 3 })
    }
  }

  if (quote) {
    if (quote.per !== null && quote.per > 0 && quote.per < 12) {
      factors.push({ name: "PER 저평가 구간", impact: "positive", strength: 4 })
    }
    if (quote.pbr !== null && quote.pbr > 0 && quote.pbr < 1) {
      factors.push({ name: "PBR 1배 미만 저평가", impact: "positive", strength: 4 })
    }
    if (quote.dividendYield !== null && quote.dividendYield > 3) {
      factors.push({ name: "높은 배당수익률", impact: "positive", strength: 3 })
    }
  }

  if (newsSentiment && newsSentiment.articles.length > 0) {
    if (newsSentiment.overallScore >= 7) {
      factors.push({ name: "뉴스 감성 긍정적", impact: "positive", strength: 3 })
    } else if (newsSentiment.overallScore <= 3) {
      factors.push({ name: "뉴스 감성 부정적", impact: "negative", strength: 3 })
    } else {
      factors.push({ name: "뉴스 감성 중립", impact: "neutral", strength: 2 })
    }
  }

  if (factors.length < 3) {
    factors.push({ name: "데이터 제한으로 부분 분석", impact: "neutral", strength: 2 })
  }

  const newsHeadlines = newsSentiment
    ? [...newsSentiment.articles].slice(0, 5).map((a) => a.title)
    : undefined

  const fallbackScore: AIScore = {
    aiScore,
    rating: getRatingFromScore(aiScore),
    probability: Math.round(aiScore * 8 + 10),
    technicalScore: techScore,
    fundamentalScore: fundScore,
    sentimentScore,
    riskScore,
    factors,
    summary: `${stockName} 종목에 대한 알고리즘 기반 분석 결과입니다. AI 분석이 불가하여 기술적/재무적 지표 기반으로 점수를 산출했습니다.`,
    keyInsight:
      "AI 엔진 미연결 상태 - 알고리즘 기반 분석 점수입니다.",
    dataSources: dataSources ?? {
      quote: false,
      technical: false,
      dart: false,
      financials: false,
      naverNews: false,
      googleNews: false,
    },
    newsHeadlines,
    analyzedAt: new Date().toISOString(),
  }

  cache.set(`ai-score:${ticker}`, fallbackScore, ONE_HOUR)
  return fallbackScore
}
