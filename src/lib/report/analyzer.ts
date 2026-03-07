/**
 * Phase 2: AI 분석 — OpenAI GPT-4o-mini
 * RawReportData를 입력받아 AI 분석을 추가한 AnalyzedReportData를 반환한다.
 */

import { generateAIAnalysis } from "@/lib/api/openai"
import {
  buildMoveAnalysisPrompt,
  buildExecutiveSummaryPrompt,
  buildPortfolioInsightPrompt,
  buildWatchPointsPrompt,
} from "./prompts"
import type {
  RawReportData,
  AnalyzedReportData,
  StockAnalysis,
  StockReportData,
  MarketContextData,
  MoveReason,
  ReportProgress,
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

/** 개별 종목 등락 원인 분석 */
async function analyzeStockMove(
  stock: StockReportData,
  market: MarketContextData,
  date: string
): Promise<StockAnalysis> {
  const prompt = buildMoveAnalysisPrompt(stock, market, date)

  if (!prompt || !stock.quote) {
    return {
      ticker: stock.ticker,
      moveReasons: [],
      outlook: "데이터 부족으로 분석 불가",
    }
  }

  try {
    const response = await generateAIAnalysis(prompt)
    const parsed = parseJSON<{
      reasons: Array<{
        rank: number
        category: string
        description: string
        impact: string
        evidence: string
      }>
      outlook: string
    }>(response)

    if (!parsed) {
      return buildFallbackAnalysis(stock)
    }

    const moveReasons: MoveReason[] = (parsed.reasons ?? []).slice(0, 3).map((r, i) => ({
      rank: i + 1,
      category: validateCategory(r.category),
      description: r.description ?? "",
      impact: r.impact === "negative" ? "negative" as const : "positive" as const,
      evidence: r.evidence ?? "",
    }))

    return {
      ticker: stock.ticker,
      moveReasons,
      outlook: parsed.outlook ?? "",
    }
  } catch {
    return buildFallbackAnalysis(stock)
  }
}

function validateCategory(cat: string): MoveReason["category"] {
  const valid = ["supply_demand", "news", "technical", "sector", "macro", "event"] as const
  return valid.includes(cat as typeof valid[number])
    ? (cat as MoveReason["category"])
    : "news"
}

/** AI 실패 시 데이터 기반 대체 분석 */
function buildFallbackAnalysis(
  stock: { ticker: string; quote: { changePercent: number; change: number } | null; investorFlow: { entries: readonly { foreignNet: number }[] } | null }
): StockAnalysis {
  const q = stock.quote
  if (!q) {
    return { ticker: stock.ticker, moveReasons: [], outlook: "데이터 없음" }
  }

  const direction = q.changePercent >= 0 ? "상승" : "하락"
  const reasons: MoveReason[] = []

  const flow = stock.investorFlow?.entries?.[0]
  if (flow) {
    reasons.push({
      rank: 1,
      category: "supply_demand",
      description: `외국인 순${flow.foreignNet >= 0 ? "매수" : "매도"} 영향`,
      impact: flow.foreignNet >= 0 ? "positive" : "negative",
      evidence: `외국인 ${flow.foreignNet.toLocaleString("ko-KR")}주 순매매`,
    })
  }

  reasons.push({
    rank: reasons.length + 1,
    category: "technical",
    description: `전일대비 ${q.changePercent >= 0 ? "+" : ""}${q.changePercent.toFixed(2)}% ${direction}`,
    impact: q.changePercent >= 0 ? "positive" : "negative",
    evidence: `종가 변동 ${q.change >= 0 ? "+" : ""}${q.change.toLocaleString("ko-KR")}원`,
  })

  return {
    ticker: stock.ticker,
    moveReasons: reasons,
    outlook: `전일 ${direction} 마감. 추가 분석 데이터를 확인하세요.`,
  }
}

/** 전체 AI 분석 파이프라인 */
export async function analyzeReportData(
  raw: RawReportData,
  onProgress?: (p: ReportProgress) => void
): Promise<AnalyzedReportData> {
  onProgress?.({ phase: "analyzing", progress: 42, message: "종목별 등락 원인 분석 중..." })

  // 종목별 분석 (순차 호출 — OpenAI rate limit 고려)
  const stockAnalyses: StockAnalysis[] = []
  for (let i = 0; i < raw.stocks.length; i++) {
    const stock = raw.stocks[i]
    const analysis = await analyzeStockMove(stock, raw.market, raw.date)
    stockAnalyses.push(analysis)
    const pct = 42 + Math.round(((i + 1) / raw.stocks.length) * 20)
    onProgress?.({
      phase: "analyzing",
      progress: pct,
      message: `${stock.name} 분석 완료 (${i + 1}/${raw.stocks.length})`,
    })
  }

  onProgress?.({ phase: "analyzing", progress: 65, message: "종합 요약 생성 중..." })

  // Executive Summary + Portfolio Insight + Watch Points 병렬 호출
  const [summaryResult, insightResult, watchResult] = await Promise.allSettled([
    generateAIAnalysis(buildExecutiveSummaryPrompt(raw.stocks, raw.market, raw.date)),
    generateAIAnalysis(buildPortfolioInsightPrompt(raw.stocks)),
    generateAIAnalysis(buildWatchPointsPrompt(raw.stocks, raw.market)),
  ])

  const executiveSummary = summaryResult.status === "fulfilled"
    ? summaryResult.value
    : buildFallbackSummary(raw)

  const portfolioInsight = insightResult.status === "fulfilled"
    ? insightResult.value
    : "포트폴리오 분석을 수행할 수 없습니다."

  let watchPoints: string[] = []
  if (watchResult.status === "fulfilled") {
    const parsed = parseJSON<string[]>(watchResult.value)
    watchPoints = parsed ?? [watchResult.value]
  }

  onProgress?.({ phase: "analyzing", progress: 80, message: "AI 분석 완료" })

  return {
    ...raw,
    executiveSummary,
    stockAnalyses,
    portfolioInsight,
    watchPoints,
  }
}

function buildFallbackSummary(raw: RawReportData): string {
  const upCount = raw.stocks.filter((s) => s.quote && s.quote.changePercent > 0).length
  const downCount = raw.stocks.filter((s) => s.quote && s.quote.changePercent < 0).length
  return `관심종목 ${raw.stocks.length}개 중 ${upCount}개 상승, ${downCount}개 하락했습니다.`
}
