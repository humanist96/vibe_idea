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
  ConvictionScore,
  ConvictionFactor,
  ActionItem,
  RiskAlert,
  AnalystDigest,
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

/** 리스크 알림 생성 (데이터 기반, AI 불필요) */
export function buildRiskAlerts(stock: StockReportData): RiskAlert[] {
  const alerts: RiskAlert[] = []
  const q = stock.quote
  const t = stock.technical

  if (t) {
    if (t.rsi > 70) {
      alerts.push({ level: "warning", label: "RSI 과매수", detail: `RSI ${t.rsi.toFixed(0)} — 단기 과열 구간` })
    } else if (t.rsi < 30) {
      alerts.push({ level: "info", label: "RSI 과매도", detail: `RSI ${t.rsi.toFixed(0)} — 반등 가능 구간` })
    }
    if (t.macdHistogram < 0 && t.macdLine < t.macdSignal) {
      alerts.push({ level: "warning", label: "MACD 데드크로스", detail: "하락 추세 전환 신호" })
    }
  }

  // 외국인 연속 매도 체크
  const entries = stock.investorFlow?.entries ?? []
  const consecutiveSells = entries.slice(0, 5).filter((e) => e.foreignNet < 0).length
  if (consecutiveSells >= 4) {
    alerts.push({ level: "critical", label: "외국인 연속 매도", detail: `최근 5일 중 ${consecutiveSells}일 순매도` })
  }

  // 거래량 급증
  if (q && stock.historical.length >= 2) {
    const avgVol = stock.historical.slice(0, -1).reduce((s, h) => s + h.volume, 0) / Math.max(stock.historical.length - 1, 1)
    if (avgVol > 0 && q.volume / avgVol > 3) {
      alerts.push({ level: "warning", label: "거래량 급증", detail: `평균 대비 ${(q.volume / avgVol).toFixed(1)}배` })
    }
  }

  // 목표가 대비 고평가
  const targetPrice = stock.consensus?.consensus?.targetPrice
  if (targetPrice && q && q.price > targetPrice * 1.1) {
    alerts.push({ level: "warning", label: "목표가 초과", detail: `현재가가 컨센서스 목표가 대비 ${(((q.price - targetPrice) / targetPrice) * 100).toFixed(0)}% 높음` })
  }

  return alerts
}

/** 애널리스트 다이제스트 빌드 (AI 응답 보완) */
export function buildAnalystDigest(stock: StockReportData, aiDigest: string): AnalystDigest | null {
  const consensus = stock.consensus
  if (!consensus) return null

  const q = stock.quote
  const targetPrice = consensus.consensus.targetPrice
  const targetPriceUpside = targetPrice && q
    ? Number((((targetPrice - q.price) / q.price) * 100).toFixed(1))
    : null

  // 리포트 목표가 추세로 의견 트렌드 추정
  const reportPrices = consensus.reports
    .filter((r) => r.targetPrice !== null)
    .map((r) => r.targetPrice!)
  let opinionTrend: string | null = null
  if (reportPrices.length >= 2) {
    const recent = reportPrices.slice(0, Math.ceil(reportPrices.length / 2))
    const older = reportPrices.slice(Math.ceil(reportPrices.length / 2))
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length
    if (recentAvg > olderAvg * 1.03) opinionTrend = "상향"
    else if (recentAvg < olderAvg * 0.97) opinionTrend = "하향"
    else opinionTrend = "유지"
  }

  return {
    summary: aiDigest || `${consensus.consensus.investmentOpinion ?? "중립"} 의견, 목표가 ${targetPrice ? targetPrice.toLocaleString("ko-KR") + "원" : "미제시"}`,
    recentReports: consensus.reports.slice(0, 5).map((r) => ({
      title: r.title,
      provider: r.provider,
      date: r.date,
      targetPrice: r.targetPrice,
    })),
    targetPriceUpside,
    opinionTrend,
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
      conviction: null,
      actionItem: null,
      riskAlerts: buildRiskAlerts(stock),
      analystDigest: buildAnalystDigest(stock, ""),
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
      return buildFallbackAnalysis(stock)
    }

    const moveReasons: MoveReason[] = (parsed.reasons ?? []).slice(0, 3).map((r, i) => ({
      rank: i + 1,
      category: validateCategory(r.category),
      description: r.description ?? "",
      impact: r.impact === "negative" ? "negative" as const : "positive" as const,
      evidence: r.evidence ?? "",
    }))

    // Conviction Score
    let conviction: ConvictionScore | null = null
    if (parsed.conviction) {
      const c = parsed.conviction
      const factors: ConvictionFactor[] = (c.factors ?? []).map((f) => ({
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
      moveReasons,
      outlook: parsed.outlook ?? "",
      conviction,
      actionItem,
      riskAlerts: buildRiskAlerts(stock),
      analystDigest: buildAnalystDigest(stock, parsed.analystDigest ?? ""),
    }
  } catch {
    return buildFallbackAnalysis(stock)
  }
}

function validateCategory(cat: string): MoveReason["category"] {
  const valid = ["supply_demand", "news", "technical", "sector", "macro", "event", "analyst"] as const
  return valid.includes(cat as typeof valid[number])
    ? (cat as MoveReason["category"])
    : "news"
}

/** AI 실패 시 데이터 기반 대체 분석 */
function buildFallbackAnalysis(
  stock: StockReportData
): StockAnalysis {
  const q = stock.quote
  if (!q) {
    return { ticker: stock.ticker, moveReasons: [], outlook: "데이터 없음", conviction: null, actionItem: null, riskAlerts: buildRiskAlerts(stock), analystDigest: buildAnalystDigest(stock, "") }
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
    conviction: null,
    actionItem: null,
    riskAlerts: buildRiskAlerts(stock),
    analystDigest: buildAnalystDigest(stock, ""),
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
