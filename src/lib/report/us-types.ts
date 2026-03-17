/**
 * US 데일리 분석 보고서 타입 정의
 */

import type { TechnicalIndicators } from "@/lib/analysis/technical"
import type { FearGreedData } from "@/lib/api/fear-greed"
import type { USConsensusData } from "@/lib/api/finnhub-consensus"
import type { GlobalMacroIndicator } from "@/lib/api/fred-types"
import type { ConvictionScore, ActionItem, RiskAlert, AnalystDigest } from "@/lib/report/types"

// ── Market Context ──────────────────────────────────────

export interface USMarketIndex {
  readonly symbol: string
  readonly name: string
  readonly price: number
  readonly change: number
  readonly changePercent: number
}

export interface USSectorPerformance {
  readonly sector: string
  readonly sectorKr: string
  readonly etf: string
  readonly changePercent: number
}

export interface USMarketContextData {
  readonly indices: readonly USMarketIndex[]
  readonly fearGreed: FearGreedData | null
  readonly sectors: readonly USSectorPerformance[]
  readonly macro: readonly GlobalMacroIndicator[]
}

// ── Per-Stock Data ──────────────────────────────────────

export interface USStockQuote {
  readonly price: number
  readonly change: number
  readonly changePercent: number
  readonly high: number
  readonly low: number
  readonly previousClose: number
}

export interface USStockMetrics {
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

export interface USHistoricalPoint {
  readonly date: string
  readonly close: number
  readonly volume: number
}

export interface USNewsItem {
  readonly headline: string
  readonly source: string
  readonly datetime: number
  readonly url: string
}

export interface USStockReportData {
  readonly symbol: string
  readonly name: string
  readonly nameKr: string
  readonly sector: string
  readonly sectorKr: string
  readonly quote: USStockQuote | null
  readonly metrics: USStockMetrics
  readonly historical: readonly USHistoricalPoint[]
  readonly news: readonly USNewsItem[]
  readonly technical: TechnicalIndicators | null
  readonly consensus: USConsensusData | null
}

// ── Raw Report (Phase 1 Output) ─────────────────────────

export interface USRawReportData {
  readonly date: string
  readonly generatedAt: string
  readonly market: USMarketContextData
  readonly stocks: readonly USStockReportData[]
}

// ── Analysis (Phase 2 Output) ───────────────────────────

export type USMoveReasonCategory =
  | "valuation"
  | "momentum"
  | "news"
  | "technical"
  | "earnings"
  | "macro"

export interface USMoveReason {
  readonly rank: number
  readonly category: USMoveReasonCategory
  readonly description: string
  readonly impact: "positive" | "negative"
  readonly evidence: string
}

export interface USStockAnalysis {
  readonly symbol: string
  readonly moveReasons: readonly USMoveReason[]
  readonly outlook: string
  readonly conviction: ConvictionScore | null
  readonly actionItem: ActionItem | null
  readonly riskAlerts: readonly RiskAlert[]
  readonly analystDigest: AnalystDigest | null
}

export interface USAnalyzedReportData extends USRawReportData {
  readonly executiveSummary: string
  readonly stockAnalyses: readonly USStockAnalysis[]
  readonly portfolioInsight: string
  readonly watchPoints: readonly string[]
}

// ── Metadata ────────────────────────────────────────────

export interface USReportMeta {
  readonly id: string
  readonly date: string
  readonly generatedAt: string
  readonly stockCount: number
  readonly summary: string
  readonly symbols: readonly string[]
}
