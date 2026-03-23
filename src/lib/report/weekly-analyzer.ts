/**
 * Phase 2: 주간 AI 분석 — OpenAI GPT-4o-mini
 * WeeklyRawData를 입력받아 AI 분석을 추가한 WeeklyAnalyzedData를 반환한다.
 */

import { generateAIAnalysis } from "@/lib/api/openai"
import { analyzeBatch } from "./batch-utils"
import {
  buildWeeklyStockPrompt,
  buildWeeklySummaryPrompt,
  buildWeeklyOutlookPrompt,
  buildWeeklyHighlightsPrompt,
} from "./weekly-prompts"
import { buildRiskAlerts, buildAnalystDigest } from "./analyzer"
import type {
  WeeklyRawData,
  WeeklyAnalyzedData,
  WeeklyStockData,
  WeeklyMarketData,
  WeeklyStockAnalysis,
  ConsensusChange,
  NextWeekOutlook,
} from "./weekly-types"
import type {
  ReportProgress,
  ConvictionScore,
  ConvictionFactor,
  ActionItem,
  RiskAlert,
  AnalystDigest,
  StockReportData,
} from "./types"

/** JSON 응답에서 코드 블록 제거 후 파싱 */
function parseJSON<T>(text: string): T | null {
  try {
    const cleaned = text
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim()
    return JSON.parse(cleaned) as T
  } catch {
    return null
  }
}

/** 컨센서스 변화 계산 */
function buildConsensusChange(stock: WeeklyStockData): ConsensusChange | null {
  const start = stock.consensusStart
  const end = stock.consensusEnd

  if (!start && !end) return null

  const before = start?.targetPrice ?? null
  const after = end?.targetPrice ?? null

  const targetPriceChange = before !== null && after !== null && before > 0
    ? Number((((after - before) / before) * 100).toFixed(1))
    : null

  let opinionChange: string | null = null
  if (before !== null && after !== null && before > 0) {
    if (after > before * 1.03) {
      opinionChange = "상향"
    } else if (after < before * 0.97) {
      opinionChange = "하향"
    } else {
      opinionChange = "유지"
    }
  }

  return {
    targetPriceBefore: before,
    targetPriceAfter: after,
    targetPriceChange,
    opinionChange,
  }
}

/** WeeklyStockData를 buildRiskAlerts가 요구하는 StockReportData 형태로 변환 */
function toStockReportDataForRisk(stock: WeeklyStockData): StockReportData {
  return {
    ticker: stock.ticker,
    name: stock.name,
    quote: {
      price: stock.weekClose,
      change: stock.weekChange,
      changePercent: stock.weekChangePercent,
      volume: stock.weekVolume,
      marketCap: 0,
      high: stock.weekHigh,
      low: stock.weekLow,
      open: stock.weekOpen,
      prevClose: stock.weekOpen,
      timestamp: "",
    },
    historical: [],
    investorFlow: {
      entries: [{
        date: "",
        foreignNet: stock.weekForeignNet,
        institutionNet: stock.weekInstitutionNet,
        individualNet: -(stock.weekForeignNet + stock.weekInstitutionNet),
        foreignRatio: 0,
      }],
    },
    consensus: stock.consensusEnd
      ? {
          consensus: {
            targetPrice: stock.consensusEnd.targetPrice,
            investmentOpinion: stock.consensusEnd.investmentOpinion,
            analystCount: stock.consensusEnd.analystCount,
          },
          reports: [],
        }
      : null,
    insider: [],
    blockHoldings: [],
    news: stock.news.map((n) => ({
      title: n.title,
      url: n.url,
      publishedAt: n.publishedAt,
      source: n.source,
    })),
    events: [],
    technical: stock.technical
      ? {
          ...stock.technical,
          sma5: 0,
          bollingerUpper: 0,
          bollingerMiddle: stock.technical.sma20,
          bollingerLower: 0,
        }
      : null,
    sentiment: stock.sentiment
      ? {
          ...stock.sentiment,
          totalCount: stock.sentiment.positiveCount + stock.sentiment.negativeCount + stock.sentiment.neutralCount,
        }
      : null,
    aiScore: null,
  } as unknown as StockReportData
}

/** 개별 종목 주간 분석 */
async function analyzeWeeklyStock(
  stock: WeeklyStockData,
  market: WeeklyMarketData
): Promise<WeeklyStockAnalysis> {
  const prompt = buildWeeklyStockPrompt(stock, market)
  const stockProxy = toStockReportDataForRisk(stock)

  try {
    const response = await generateAIAnalysis(prompt)
    const parsed = parseJSON<{
      weekSummary: string
      conviction?: {
        score: number
        label: string
        factors: Array<{ name: string; signal: string; weight: number }>
      }
      actionItem?: {
        action: string
        reason: string
        conditions: string[]
      }
      analystDigest?: string
    }>(response)

    if (!parsed) {
      return buildFallbackWeeklyAnalysis(stock, stockProxy)
    }

    // Conviction Score
    let conviction: ConvictionScore | null = null
    if (parsed.conviction) {
      const c = parsed.conviction
      const factors: readonly ConvictionFactor[] = (c.factors ?? []).map((f) => ({
        name: f.name,
        signal: (["bullish", "bearish", "neutral"].includes(f.signal) ? f.signal : "neutral") as "bullish" | "bearish" | "neutral",
        weight: f.weight,
      }))
      conviction = {
        score: Math.max(1, Math.min(10, c.score)),
        label: c.label ?? "중립",
        factors,
      }
    }

    // Action Item
    let actionItem: ActionItem | null = null
    if (parsed.actionItem) {
      const a = parsed.actionItem
      const validActions = ["매수 고려", "비중 확대", "관망", "비중 축소", "매도 고려"] as const
      const action = validActions.includes(a.action as typeof validActions[number])
        ? (a.action as ActionItem["action"])
        : "관망"
      actionItem = {
        action,
        reason: a.reason ?? "",
        conditions: a.conditions ?? [],
      }
    }

    return {
      ticker: stock.ticker,
      weekSummary: parsed.weekSummary ?? "",
      conviction,
      actionItem,
      riskAlerts: buildRiskAlerts(stockProxy),
      analystDigest: buildAnalystDigest(stockProxy, parsed.analystDigest ?? ""),
      consensusChange: buildConsensusChange(stock),
    }
  } catch {
    return buildFallbackWeeklyAnalysis(stock, stockProxy)
  }
}

/** AI 실패 시 데이터 기반 대체 분석 */
function buildFallbackWeeklyAnalysis(
  stock: WeeklyStockData,
  stockProxy: StockReportData
): WeeklyStockAnalysis {
  const direction = stock.weekChangePercent >= 0 ? "상승" : "하락"
  const foreignLabel = stock.weekForeignNet > 0
    ? "외국인 순매수"
    : stock.weekForeignNet < 0
      ? "외국인 순매도"
      : "외국인 보합"

  const weekSummary = `${stock.name}은(는) 주간 ${stock.weekChangePercent >= 0 ? "+" : ""}${stock.weekChangePercent.toFixed(2)}% ${direction}했습니다. ${foreignLabel} ${Math.abs(stock.weekForeignNet).toLocaleString("ko-KR")}주가 관측되었습니다.`

  return {
    ticker: stock.ticker,
    weekSummary,
    conviction: stock.currentConviction,
    actionItem: null,
    riskAlerts: buildRiskAlerts(stockProxy),
    analystDigest: buildAnalystDigest(stockProxy, ""),
    consensusChange: buildConsensusChange(stock),
  }
}

/** 전체 주간 AI 분석 파이프라인 */
export async function analyzeWeeklyData(
  raw: WeeklyRawData,
  onProgress?: (p: ReportProgress) => void
): Promise<WeeklyAnalyzedData> {
  onProgress?.({ phase: "analyzing", progress: 42, message: "종목별 주간 분석 중..." })

  // 1. 종목별 분석 (5건 배치 병렬 — 타임아웃 최적화)
  const stockAnalyses = await analyzeBatch(
    raw.stocks,
    (stock) => analyzeWeeklyStock(stock, raw.market),
    (stock) => buildFallbackWeeklyAnalysis(stock, toStockReportDataForRisk(stock)),
    {
      batchSize: 5,
      onBatchComplete: (completed, total) => {
        const pct = 42 + Math.round((completed / total) * 20)
        onProgress?.({
          phase: "analyzing",
          progress: pct,
          message: `${completed}/${total} 종목 주간 분석 완료`,
        })
      },
    }
  )

  onProgress?.({ phase: "analyzing", progress: 65, message: "주간 종합 요약 생성 중..." })

  // 2. 병렬: executiveSummary, portfolioInsight, nextWeekOutlook, weeklyHighlights
  const [summaryResult, insightResult, outlookResult, highlightsResult] = await Promise.allSettled([
    generateAIAnalysis(
      buildWeeklySummaryPrompt(raw.stocks, raw.market, raw.weekStart, raw.weekEnd)
    ),
    generateAIAnalysis(buildWeeklyPortfolioInsightPrompt(raw.stocks)),
    generateAIAnalysis(buildWeeklyOutlookPrompt(raw.stocks, raw.market)),
    generateAIAnalysis(buildWeeklyHighlightsPrompt(raw.stocks, raw.market)),
  ])

  // Executive Summary
  const executiveSummary = summaryResult.status === "fulfilled"
    ? summaryResult.value
    : buildFallbackWeeklySummary(raw)

  // Portfolio Insight
  const portfolioInsight = insightResult.status === "fulfilled"
    ? insightResult.value
    : "주간 포트폴리오 분석을 수행할 수 없습니다."

  // Next Week Outlook
  let nextWeekOutlook: NextWeekOutlook = { events: [], risks: [], strategy: "전망 데이터를 생성할 수 없습니다." }
  if (outlookResult.status === "fulfilled") {
    const parsed = parseJSON<{ events: string[]; risks: string[]; strategy: string }>(outlookResult.value)
    if (parsed) {
      nextWeekOutlook = {
        events: parsed.events ?? [],
        risks: parsed.risks ?? [],
        strategy: parsed.strategy ?? "",
      }
    }
  }

  // Weekly Highlights
  let weeklyHighlights: readonly string[] = []
  if (highlightsResult.status === "fulfilled") {
    const parsed = parseJSON<string[]>(highlightsResult.value)
    weeklyHighlights = parsed ?? [highlightsResult.value]
  }

  onProgress?.({ phase: "analyzing", progress: 80, message: "주간 AI 분석 완료" })

  return {
    ...raw,
    executiveSummary,
    stockAnalyses,
    portfolioInsight,
    nextWeekOutlook,
    weeklyHighlights,
  }
}

/** 주간 포트폴리오 인사이트 프롬프트 (내부 전용) */
function buildWeeklyPortfolioInsightPrompt(
  stocks: readonly WeeklyStockData[]
): string {
  const data = stocks
    .map((s) => {
      const conviction = s.currentConviction
        ? `확신도 ${s.currentConviction.score}/10`
        : "확신도 N/A"
      return `- ${s.name}(${s.ticker}): 주간 ${s.weekChangePercent >= 0 ? "+" : ""}${s.weekChangePercent.toFixed(2)}%, ${conviction}`
    })
    .join("\n")

  return `아래는 사용자의 관심종목 포트폴리오 주간 데이터입니다.

${data}

주간 포트폴리오 관점에서 분석하세요:
1. 종목 다각화 평가
2. 주간 리스크 집중 요인
3. 개선 제안 (1가지)

3-4문장으로 간결하게 작성하세요. JSON이 아닌 일반 텍스트로 응답하세요.`
}

/** fallback 주간 요약 */
function buildFallbackWeeklySummary(raw: WeeklyRawData): string {
  const upCount = raw.stocks.filter((s) => s.weekChangePercent > 0).length
  const downCount = raw.stocks.filter((s) => s.weekChangePercent < 0).length
  return `${raw.weekStart} ~ ${raw.weekEnd} 주간 관심종목 ${raw.stocks.length}개 중 ${upCount}개 상승, ${downCount}개 하락했습니다.`
}
