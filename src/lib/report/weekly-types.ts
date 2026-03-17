/**
 * 주간 분석 보고서 타입 정의
 */

import type { ConvictionScore, ActionItem, RiskAlert, AnalystDigest } from "./types"
import type { TechnicalIndicators } from "@/lib/analysis/technical"
import type { NewsSentiment, NewsArticle } from "@/lib/api/news-types"

// ── Phase 1: Collection Output ──────────────────────────────────

export interface WeeklyRawData {
  readonly weekStart: string
  readonly weekEnd: string
  readonly generatedAt: string
  readonly market: WeeklyMarketData
  readonly stocks: readonly WeeklyStockData[]
}

export interface WeeklyMarketData {
  readonly indices: readonly WeeklyIndexChange[]
  readonly sectorPerformance: readonly SectorWeeklyPerf[]
  readonly macroEvents: readonly string[]
  readonly fearGreedStart: number | null
  readonly fearGreedEnd: number | null
}

export interface WeeklyIndexChange {
  readonly name: string
  readonly weekOpen: number
  readonly weekClose: number
  readonly weekChange: number
  readonly weekChangePercent: number
  readonly weekHigh: number
  readonly weekLow: number
}

export interface SectorWeeklyPerf {
  readonly sector: string
  readonly changePercent: number
  readonly topStock: string
}

export interface WeeklyStockData {
  readonly ticker: string
  readonly name: string
  readonly weekOpen: number
  readonly weekClose: number
  readonly weekChange: number
  readonly weekChangePercent: number
  readonly weekHigh: number
  readonly weekLow: number
  readonly weekVolume: number
  readonly weekForeignNet: number
  readonly weekInstitutionNet: number
  readonly consensusStart: ConsensusSnapshot | null
  readonly consensusEnd: ConsensusSnapshot | null
  readonly currentConviction: ConvictionScore | null
  readonly technical: TechnicalIndicators | null
  readonly sentiment: NewsSentiment | null
  readonly news: readonly NewsArticle[]
}

export interface ConsensusSnapshot {
  readonly targetPrice: number | null
  readonly investmentOpinion: string | null
  readonly analystCount: number
}

// ── Phase 2: Analysis Output ────────────────────────────────────

export interface WeeklyAnalyzedData extends WeeklyRawData {
  readonly executiveSummary: string
  readonly stockAnalyses: readonly WeeklyStockAnalysis[]
  readonly portfolioInsight: string
  readonly nextWeekOutlook: NextWeekOutlook
  readonly weeklyHighlights: readonly string[]
}

export interface WeeklyStockAnalysis {
  readonly ticker: string
  readonly weekSummary: string
  readonly conviction: ConvictionScore | null
  readonly actionItem: ActionItem | null
  readonly riskAlerts: readonly RiskAlert[]
  readonly analystDigest: AnalystDigest | null
  readonly consensusChange: ConsensusChange | null
}

export interface ConsensusChange {
  readonly targetPriceBefore: number | null
  readonly targetPriceAfter: number | null
  readonly targetPriceChange: number | null
  readonly opinionChange: string | null
}

export interface NextWeekOutlook {
  readonly events: readonly string[]
  readonly risks: readonly string[]
  readonly strategy: string
}

// ── Report Metadata ─────────────────────────────────────────────

export interface WeeklyReportMeta {
  readonly id: string
  readonly weekStart: string
  readonly weekEnd: string
  readonly generatedAt: string
  readonly stockCount: number
  readonly summary: string
  readonly tickers: readonly string[]
}
