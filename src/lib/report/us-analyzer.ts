/**
 * Phase 2: US 보고서 AI 분석 파이프라인
 * 수집된 데이터를 OpenAI로 분석하여 USAnalyzedReportData를 생성한다.
 */

import OpenAI from "openai"
import { calcRecommendationSummary } from "@/lib/api/finnhub-consensus"
import type {
  USRawReportData,
  USAnalyzedReportData,
  USStockAnalysis,
  USStockReportData,
  USMarketContextData,
  USMoveReason,
} from "./us-types"
import type {
  ConvictionScore,
  ConvictionFactor,
  ActionItem,
  RiskAlert,
  AnalystDigest,
} from "./types"
import {
  buildUSMoveAnalysisPrompt,
  buildUSExecutiveSummaryPrompt,
  buildUSPortfolioInsightPrompt,
  buildUSWatchPointsPrompt,
} from "./us-prompts"

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured")
  return new OpenAI({ apiKey })
}

async function generateAI(prompt: string): Promise<string> {
  const openai = getOpenAIClient()
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 2000,
    temperature: 0.3,
  })
  return completion.choices[0]?.message?.content ?? ""
}

function parseJSON<T>(raw: string, fallback: T): T {
  try {
    const cleaned = raw
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim()
    return JSON.parse(cleaned) as T
  } catch {
    return fallback
  }
}

// ── Risk Alerts (data-driven, no AI) ───────────────────

export function buildUSRiskAlerts(stock: USStockReportData): readonly RiskAlert[] {
  const alerts: RiskAlert[] = []
  const q = stock.quote
  const t = stock.technical

  if (t) {
    if (t.rsi > 70) {
      alerts.push({
        level: "warning",
        label: "RSI 과매수",
        detail: `RSI ${t.rsi.toFixed(0)} — 단기 과열 구간`,
      })
    } else if (t.rsi < 30) {
      alerts.push({
        level: "info",
        label: "RSI 과매도",
        detail: `RSI ${t.rsi.toFixed(0)} — 반등 가능 구간`,
      })
    }

    if (t.macdHistogram < 0 && t.macdLine < t.macdSignal) {
      alerts.push({
        level: "warning",
        label: "MACD 데드크로스",
        detail: "하락 추세 전환 신호",
      })
    }
  }

  // 52주 고점 5% 이내
  if (q && stock.metrics.fiftyTwoWeekHigh != null) {
    const highGap =
      ((stock.metrics.fiftyTwoWeekHigh - q.price) / stock.metrics.fiftyTwoWeekHigh) * 100
    if (highGap >= 0 && highGap <= 5) {
      alerts.push({
        level: "info",
        label: "52주 고점 근접",
        detail: `현재가가 52주 고점($${stock.metrics.fiftyTwoWeekHigh.toFixed(2)}) 대비 ${highGap.toFixed(1)}% 이내`,
      })
    }
  }

  // 거래량 급증 (historical 데이터 기반)
  if (stock.historical.length >= 5) {
    const recent = stock.historical[stock.historical.length - 1]
    const older = stock.historical.slice(0, -1)
    const avgVol = older.reduce((s, h) => s + h.volume, 0) / older.length
    if (avgVol > 0 && recent && recent.volume / avgVol > 3) {
      alerts.push({
        level: "warning",
        label: "거래량 급증",
        detail: `평균 대비 ${(recent.volume / avgVol).toFixed(1)}배`,
      })
    }
  }

  // 목표가 초과
  const targetMean = stock.consensus?.priceTarget?.targetMean
  if (targetMean && q && q.price > targetMean * 1.1) {
    const overPct = (((q.price - targetMean) / targetMean) * 100).toFixed(0)
    alerts.push({
      level: "warning",
      label: "목표가 초과",
      detail: `현재가가 평균 목표가($${targetMean.toFixed(2)}) 대비 ${overPct}% 높음`,
    })
  }

  return alerts
}

// ── Analyst Digest (data + AI string) ──────────────────

export function buildUSAnalystDigest(
  stock: USStockReportData,
  aiDigest: string
): AnalystDigest | null {
  const consensus = stock.consensus
  if (!consensus || (!consensus.recommendation && !consensus.priceTarget)) {
    return null
  }

  const q = stock.quote
  const targetMean = consensus.priceTarget?.targetMean ?? null

  const targetPriceUpside =
    targetMean && q
      ? Number((((targetMean - q.price) / q.price) * 100).toFixed(1))
      : null

  // Opinion trend from bullish percentage
  let opinionTrend: string | null = null
  if (consensus.recommendation) {
    const { bullishPct } = calcRecommendationSummary(consensus.recommendation)
    if (bullishPct > 60) {
      opinionTrend = "상향"
    } else if (bullishPct < 30) {
      opinionTrend = "하향"
    } else {
      opinionTrend = "유지"
    }
  }

  // Single "report" representing the Finnhub consensus aggregate
  const recentReports: AnalystDigest["recentReports"] = consensus.priceTarget
    ? [
        {
          title: "Finnhub Analyst Consensus",
          provider: "Finnhub",
          date: consensus.priceTarget.lastUpdated,
          targetPrice: consensus.priceTarget.targetMean,
        },
      ]
    : []

  // Build summary fallback
  let summary = aiDigest
  if (!summary && consensus.recommendation) {
    const { totalAnalysts, bullishCount, bullishPct } = calcRecommendationSummary(
      consensus.recommendation
    )
    const upsideStr =
      targetPriceUpside !== null
        ? ` 평균 목표가 $${targetMean!.toFixed(2)} (현재가 대비 ${targetPriceUpside > 0 ? "+" : ""}${targetPriceUpside}%)`
        : ""
    summary = `애널리스트 ${totalAnalysts}명 중 매수 ${bullishCount}명(${bullishPct.toFixed(0)}%).${upsideStr}`
  }

  return {
    summary: summary || "컨센서스 데이터 참조",
    recentReports,
    targetPriceUpside,
    opinionTrend,
  }
}

// ── Conviction / ActionItem Validation ─────────────────

function validateConviction(raw: {
  score: number
  label: string
  factors: Array<{ name: string; signal: string; weight: number }>
}): ConvictionScore {
  const factors: readonly ConvictionFactor[] = (raw.factors ?? []).map((f) => ({
    name: f.name,
    signal: (["bullish", "bearish", "neutral"].includes(f.signal)
      ? f.signal
      : "neutral") as "bullish" | "bearish" | "neutral",
    weight: f.weight,
  }))

  return {
    score: Math.max(1, Math.min(10, raw.score)),
    label: raw.label ?? "중립",
    factors,
  }
}

function validateActionItem(raw: {
  action: string
  reason: string
  conditions: string[]
}): ActionItem {
  const validActions = [
    "매수 고려",
    "비중 확대",
    "관망",
    "비중 축소",
    "매도 고려",
  ] as const
  const action = validActions.includes(raw.action as (typeof validActions)[number])
    ? (raw.action as ActionItem["action"])
    : "관망"

  return {
    action,
    reason: raw.reason ?? "",
    conditions: raw.conditions ?? [],
  }
}

// ── Fallback Analysis ──────────────────────────────────

function buildFallbackAnalysis(stock: USStockReportData): USStockAnalysis {
  const reasons: USMoveReason[] = []
  const q = stock.quote
  const m = stock.metrics
  const t = stock.technical

  if (q && Math.abs(q.changePercent) > 1) {
    reasons.push({
      rank: 1,
      category: "momentum",
      description:
        q.changePercent > 0
          ? `주가 ${q.changePercent.toFixed(2)}% 상승, 매수 모멘텀 지속`
          : `주가 ${Math.abs(q.changePercent).toFixed(2)}% 하락, 매도 압력`,
      impact: q.changePercent > 0 ? "positive" : "negative",
      evidence: `전일대비 $${q.change.toFixed(2)} 변동`,
    })
  }

  if (t && (t.rsi > 70 || t.rsi < 30)) {
    reasons.push({
      rank: reasons.length + 1,
      category: "technical",
      description:
        t.rsi > 70 ? "RSI 과매수 구간 진입" : "RSI 과매도 구간 진입",
      impact: t.rsi > 70 ? "negative" : "positive",
      evidence: `RSI(14): ${t.rsi.toFixed(1)}`,
    })
  }

  if (m.pe && m.pe > 0) {
    reasons.push({
      rank: reasons.length + 1,
      category: "valuation",
      description:
        m.pe > 30
          ? "고PER 밸류에이션 부담"
          : m.pe < 15
            ? "저평가 매력"
            : "적정 밸류에이션 수준",
      impact: m.pe > 30 ? "negative" : "positive",
      evidence: `PER: ${m.pe.toFixed(1)}x`,
    })
  }

  return {
    symbol: stock.symbol,
    moveReasons: reasons.slice(0, 3),
    outlook: "데이터 기반 분석을 참고하여 종합적으로 판단하세요.",
    conviction: null,
    actionItem: null,
    riskAlerts: buildUSRiskAlerts(stock),
    analystDigest: buildUSAnalystDigest(stock, ""),
  }
}

// ── Per-Stock AI Analysis ──────────────────────────────

async function analyzeUSStock(
  stock: USStockReportData,
  market: USMarketContextData,
  date: string
): Promise<USStockAnalysis> {
  if (!stock.quote) return buildFallbackAnalysis(stock)

  try {
    const prompt = buildUSMoveAnalysisPrompt(stock, market, date)
    const raw = await generateAI(prompt)
    const parsed = parseJSON<{
      reasons: USMoveReason[]
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
    }>(raw, { reasons: [], outlook: "" })

    if (parsed.reasons.length === 0) return buildFallbackAnalysis(stock)

    const conviction = parsed.conviction
      ? validateConviction(parsed.conviction)
      : null

    const actionItem = parsed.actionItem
      ? validateActionItem(parsed.actionItem)
      : null

    return {
      symbol: stock.symbol,
      moveReasons: parsed.reasons.slice(0, 3),
      outlook: parsed.outlook || "추가 분석이 필요합니다.",
      conviction,
      actionItem,
      riskAlerts: buildUSRiskAlerts(stock),
      analystDigest: buildUSAnalystDigest(stock, parsed.analystDigest ?? ""),
    }
  } catch {
    return buildFallbackAnalysis(stock)
  }
}

// ── Full Analysis Pipeline ─────────────────────────────

export async function analyzeUSReportData(
  raw: USRawReportData
): Promise<USAnalyzedReportData> {
  // Sequential stock analysis (rate limit safe)
  const stockAnalyses: USStockAnalysis[] = []
  for (const stock of raw.stocks) {
    const analysis = await analyzeUSStock(stock, raw.market, raw.date)
    stockAnalyses.push(analysis)
  }

  // Parallel summary analyses
  const [summaryRaw, insightRaw, watchRaw] = await Promise.allSettled([
    generateAI(buildUSExecutiveSummaryPrompt(raw)),
    generateAI(buildUSPortfolioInsightPrompt(raw)),
    generateAI(buildUSWatchPointsPrompt(raw)),
  ])

  const executiveSummary =
    summaryRaw.status === "fulfilled"
      ? summaryRaw.value
      : "시장 데이터를 수집했으나 AI 요약 생성에 실패했습니다."

  const portfolioInsight =
    insightRaw.status === "fulfilled"
      ? insightRaw.value
      : "포트폴리오 분석을 생성할 수 없습니다."

  const defaultWatchPoints = ["시장 동향을 지속적으로 모니터링하세요."]
  let watchPoints = defaultWatchPoints
  if (watchRaw.status === "fulfilled") {
    const parsed = parseJSON<string[]>(watchRaw.value, defaultWatchPoints)
    if (Array.isArray(parsed) && parsed.length > 0) {
      watchPoints = parsed
    }
  }

  return {
    ...raw,
    executiveSummary,
    stockAnalyses,
    portfolioInsight,
    watchPoints,
  }
}
