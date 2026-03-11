/**
 * 배당 연구소 (Dividend Lab) 타입 정의
 */

// ── 배당주 스크리너 ──────────────────────────────

export type DividendMarket = "KR" | "US"
export type DividendFrequency = "annual" | "semi" | "quarterly" | "monthly"
export type DividendScreenerPreset =
  | "high-yield"
  | "growth"
  | "safety"
  | "aristocrat"
  | "monthly"
  | "value"

export type DividendSafetyGrade = "A+" | "A" | "B+" | "B" | "C" | "D" | "F"

export interface DividendStock {
  readonly ticker: string
  readonly name: string
  readonly nameKr: string
  readonly market: DividendMarket
  readonly sector: string
  readonly sectorKr: string
  readonly currentPrice: number
  readonly currency: "KRW" | "USD"

  // 배당 지표
  readonly dividendYield: number
  readonly dividendPerShare: number
  readonly payoutRatio: number | null
  readonly dividendGrowthRate: number | null
  readonly consecutiveYears: number
  readonly frequency: DividendFrequency
  readonly exDividendDate: string | null
  readonly paymentDate: string | null
  readonly paymentMonths: readonly number[]

  // 밸류에이션 지표
  readonly marketCap: number | null
  readonly per: number | null
  readonly pbr: number | null

  // 안전성 지표
  readonly safetyScore: number
  readonly safetyGrade: DividendSafetyGrade
  readonly fcfCoverage: number | null
  readonly debtToEquity: number | null

  // 배당 이력
  readonly dividendHistory: readonly DividendHistoryEntry[]
}

export interface DividendHistoryEntry {
  readonly year: number
  readonly amount: number
  readonly yield: number
}

// ── 스크리너 필터 ──────────────────────────────

export interface DividendScreenerFilters {
  readonly market: DividendMarket | "ALL"
  readonly preset: DividendScreenerPreset | null
  readonly yieldMin: number
  readonly yieldMax: number
  readonly payoutRatioMax: number | null
  readonly consecutiveYearsMin: number
  readonly growthRateMin: number | null
  readonly marketCapMin: number | null
  readonly sectors: readonly string[]
  readonly frequency: readonly DividendFrequency[]
  readonly debtToEquityMax: number | null
  readonly fcfCoverageMin: number | null
  readonly perMax: number | null
  readonly pbrMax: number | null
}

export type DividendSortField =
  | "yield"
  | "growthRate"
  | "safetyScore"
  | "consecutiveYears"
  | "marketCap"
  | "dividendPerShare"

export interface DividendScreenerRequest {
  readonly market: DividendMarket | "ALL"
  readonly preset: DividendScreenerPreset | null
  readonly filters: Partial<DividendScreenerFilters>
  readonly sort: DividendSortField
  readonly order: "asc" | "desc"
  readonly page: number
  readonly limit: number
}

export interface DividendScreenerResponse {
  readonly data: readonly DividendStock[]
  readonly meta: {
    readonly total: number
    readonly page: number
    readonly limit: number
  }
}

// ── 포트폴리오 설계기 ──────────────────────────────

export interface DividendPortfolioItem {
  readonly ticker: string
  readonly market: DividendMarket
  readonly weight: number
  readonly name: string
  readonly nameKr: string
  readonly sectorKr: string
}

export interface DividendPortfolioSettings {
  readonly totalAmount: number       // 만원 단위
  readonly period: number            // 투자 기간 (년)
  readonly drip: boolean             // 배당 재투자
  readonly monthlyAdd: number        // 월 추가 적립 (만원)
  readonly dividendGrowthRate: number // 배당 성장률 가정 (%/년)
}

export interface SimulationRequest {
  readonly settings: DividendPortfolioSettings
  readonly items: readonly DividendPortfolioItem[]
}

// ── 시뮬레이션 결과 ──────────────────────────────

export interface DividendSimulation {
  readonly summary: {
    readonly weightedYield: number
    readonly annualDividend: number
    readonly monthlyDividend: number
    readonly totalDividend: number
    readonly totalWithDrip: number
    readonly safetyGrade: DividendSafetyGrade
    readonly diversificationScore: number
  }

  readonly monthlySchedule: readonly MonthlyScheduleEntry[]

  readonly yearlyProjection: readonly YearlyProjectionEntry[]

  readonly sectorAllocation: readonly SectorAllocationEntry[]

  readonly risks: readonly string[]
  readonly recommendations: readonly string[]
}

export interface MonthlyScheduleEntry {
  readonly month: number
  readonly stocks: readonly {
    readonly ticker: string
    readonly name: string
    readonly amount: number
  }[]
  readonly totalAmount: number
}

export interface YearlyProjectionEntry {
  readonly year: number
  readonly investedAmount: number
  readonly portfolioValue: number
  readonly annualDividend: number
  readonly cumulativeDividend: number
  readonly yieldOnCost: number
  // DRIP 미적용 시
  readonly cumulativeDividendSimple: number
  // DRIP + 적립 시
  readonly portfolioValueWithAdd: number
  readonly cumulativeDividendWithAdd: number
}

export interface SectorAllocationEntry {
  readonly sector: string
  readonly weight: number
  readonly count: number
}

// ── 배당 캘린더 ──────────────────────────────

export type CalendarEventType = "ex-date" | "record" | "payment"

export interface DividendCalendarEvent {
  readonly ticker: string
  readonly name: string
  readonly nameKr: string
  readonly market: DividendMarket
  readonly eventType: CalendarEventType
  readonly date: string
  readonly amount: number | null
}

// ── AI 진단 ──────────────────────────────

export interface DividendDiagnosis {
  readonly overallGrade: DividendSafetyGrade
  readonly summary: string
  readonly strengths: readonly string[]
  readonly risks: readonly string[]
  readonly rebalancingSuggestions: readonly {
    readonly action: "add" | "remove" | "increase" | "decrease"
    readonly ticker: string
    readonly market: DividendMarket
    readonly reason: string
    readonly suggestedWeight?: number
  }[]
  readonly gapMonthSuggestions: readonly {
    readonly ticker: string
    readonly name: string
    readonly market: DividendMarket
    readonly reason: string
  }[]
}

export interface DividendRecommendation {
  readonly ticker: string
  readonly name: string
  readonly market: DividendMarket
  readonly dividendYield: number
  readonly reason: string
  readonly suggestedWeight: number
}

// ── 저장된 포트폴리오 (DB) ──────────────────────────

export interface SavedDividendPortfolio {
  readonly id: string
  readonly name: string
  readonly totalAmount: number
  readonly period: number
  readonly drip: boolean
  readonly monthlyAdd: number
  readonly items: readonly {
    readonly ticker: string
    readonly market: DividendMarket
    readonly weight: number
  }[]
  readonly createdAt: string
  readonly updatedAt: string
}
