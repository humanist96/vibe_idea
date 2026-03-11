import { cache, ONE_HOUR } from "@/lib/cache/memory-cache"
import { getQuote, getHistorical } from "@/lib/api/naver-finance"
import { getCompanyOverview, getFinancialStatements } from "@/lib/api/dart"
import { getNaverNews } from "@/lib/api/naver-news"
import { getGoogleNews } from "@/lib/api/google-news"
import { generateAIAnalysis } from "@/lib/api/openai"
import { calculateTechnicalIndicators } from "@/lib/analysis/technical"
import { analyzeNewsSentiment } from "@/lib/analysis/sentiment"
import { AIScoreSchema, type AIScore } from "./score-schema"
import { generateFallbackScore } from "./fallback-scoring"
import { buildScoringPrompt, type PromptData } from "./prompts"
import { parseAIJsonResponse } from "./parse-response"
import {
  ensureLoaded,
  findStock as registryFindStock,
} from "@/lib/data/stock-registry"
import * as corpCodeRegistry from "@/lib/data/corp-code-registry"
import { findStock as fallbackFindStock } from "@/lib/constants/stocks"
import type { CompanyOverview, FinancialStatement } from "@/lib/api/dart"
import type { NewsArticle } from "@/lib/api/news-types"
import type { StockQuote, HistoricalData } from "@/lib/api/naver-finance"

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
      const fallback = generateFallbackScore({
        stockName: stock.name,
        dataSources: data.sources,
      })
      cache.set(cacheKey, fallback, ONE_HOUR)
      return fallback
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

      const parsed = parseAIJsonResponse(response)
      const score = AIScoreSchema.parse({
        ...parsed,
        dataSources: data.sources,
        newsHeadlines,
        analyzedAt: new Date().toISOString(),
      })

      cache.set(cacheKey, score, ONE_HOUR)
      return score
    } catch {
      const fallback = generateFallbackScore({
        stockName: stock.name,
        technicalIndicators,
        newsSentiment,
        dataSources: data.sources,
        newsHeadlines,
        fundamentals: data.quote
          ? {
              per: data.quote.per,
              pbr: data.quote.pbr,
              eps: data.quote.eps,
              dividendYield: data.quote.dividendYield,
              marketCap: data.quote.marketCap,
              priceChange52w: data.quote.changePercent,
            }
          : null,
      })
      cache.set(cacheKey, fallback, ONE_HOUR)
      return fallback
    }
  } catch {
    return null
  }
}
