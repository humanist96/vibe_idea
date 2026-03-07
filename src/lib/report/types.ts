/**
 * 데일리 분석 보고서 타입 정의
 */

import type { StockQuote, HistoricalData, MarketIndex } from "@/lib/api/naver-finance"
import type { AIScore } from "@/lib/ai/score-schema"
import type { ConsensusData } from "@/lib/api/naver-consensus"
import type { InvestorFlow, InvestorFlowEntry } from "@/lib/api/naver-investor-types"
import type { InsiderActivity } from "@/lib/api/dart-insider-types"
import type { BlockHolding } from "@/lib/api/dart-block-holdings-types"
import type { NewsArticle, NewsSentiment } from "@/lib/api/news-types"
import type { CorporateEvent } from "@/lib/api/dart-events-types"
import type { TechnicalIndicators } from "@/lib/analysis/technical"
import type { MacroIndicator } from "@/lib/api/ecos-types"
import type { GlobalMacroIndicator } from "@/lib/api/fred-types"
import type { FearGreedData } from "@/lib/api/fear-greed"
import type { RankingStock } from "@/lib/api/naver-ranking"

// ── Phase 1: Collection Output ──────────────────────────────────

export interface RawReportData {
  readonly date: string
  readonly generatedAt: string
  readonly market: MarketContextData
  readonly stocks: readonly StockReportData[]
}

export interface MarketContextData {
  readonly indices: readonly MarketIndex[]
  readonly fearGreed: FearGreedData | null
  readonly macroKr: readonly MacroIndicator[]
  readonly macroGlobal: readonly GlobalMacroIndicator[]
  readonly topGainers: readonly RankingStock[]
  readonly topLosers: readonly RankingStock[]
}

export interface StockReportData {
  readonly ticker: string
  readonly name: string
  readonly quote: StockQuote | null
  readonly historical: readonly HistoricalData[]
  readonly investorFlow: InvestorFlow | null
  readonly consensus: ConsensusData | null
  readonly insider: readonly InsiderActivity[]
  readonly blockHoldings: readonly BlockHolding[]
  readonly news: readonly NewsArticle[]
  readonly events: readonly CorporateEvent[]
  readonly technical: TechnicalIndicators | null
  readonly sentiment: NewsSentiment | null
  readonly aiScore: AIScore | null
}

// ── Phase 2: Analysis Output ────────────────────────────────────

export interface AnalyzedReportData extends RawReportData {
  readonly executiveSummary: string
  readonly stockAnalyses: readonly StockAnalysis[]
  readonly portfolioInsight: string
  readonly watchPoints: readonly string[]
}

export type MoveReasonCategory =
  | "supply_demand"
  | "news"
  | "technical"
  | "sector"
  | "macro"
  | "event"

export interface MoveReason {
  readonly rank: number
  readonly category: MoveReasonCategory
  readonly description: string
  readonly impact: "positive" | "negative"
  readonly evidence: string
}

export interface StockAnalysis {
  readonly ticker: string
  readonly moveReasons: readonly MoveReason[]
  readonly outlook: string
}

// ── Report Metadata ─────────────────────────────────────────────

export interface ReportMeta {
  readonly id: string
  readonly date: string
  readonly generatedAt: string
  readonly stockCount: number
  readonly summary: string
  readonly tickers: readonly string[]
}

// ── Progress Tracking ───────────────────────────────────────────

export type ReportPhase = "collecting" | "analyzing" | "building" | "complete" | "error"

export interface ReportProgress {
  readonly phase: ReportPhase
  readonly progress: number
  readonly message: string
  readonly reportId?: string
}

// ── Investor Flow Summary ───────────────────────────────────────

export interface InvestorFlowSummary {
  readonly yesterday: {
    readonly foreignNet: number
    readonly institutionNet: number
    readonly individualNet: number
  }
  readonly fiveDayTotal: {
    readonly foreignNet: number
    readonly institutionNet: number
    readonly individualNet: number
  }
  readonly twentyDayTotal: {
    readonly foreignNet: number
    readonly institutionNet: number
    readonly individualNet: number
  }
  readonly entries: readonly InvestorFlowEntry[]
}

// ── Technical Signal ────────────────────────────────────────────

export type SignalType = "매수" | "중립" | "매도"

export interface TechnicalSignal {
  readonly name: string
  readonly value: string
  readonly signal: SignalType
}
