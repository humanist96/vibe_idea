/**
 * 배당 포트폴리오 시뮬레이션 엔진
 * - DRIP (배당 재투자) 복리 계산
 * - 월별 배당 스케줄 생성
 * - 섹터 분산도 분석
 */

import type {
  DividendStock,
  DividendSimulation,
  DividendPortfolioItem,
  DividendPortfolioSettings,
  MonthlyScheduleEntry,
  YearlyProjectionEntry,
  SectorAllocationEntry,
} from "./dividend-types"
import { scoreToGrade } from "./scoring"

// ── 상수 ──────────────────────────────

const WON_PER_MAN = 10000
const SECTOR_CONCENTRATION_THRESHOLD = 40
const PAYOUT_RISK_THRESHOLD = 80
const MIN_DIVERSIFIED_COUNT = 5
const MARKET_CONCENTRATION_THRESHOLD = 80
const DEFAULT_SAFETY_SCORE = 50

// ── 유틸 ──────────────────────────────

interface SimulationInput {
  readonly settings: DividendPortfolioSettings
  readonly items: readonly DividendPortfolioItem[]
  readonly stocks: ReadonlyMap<string, DividendStock>
}

function stockKey(market: string, ticker: string): string {
  return `${market}:${ticker}`
}

function calcWeightedYield(
  items: readonly DividendPortfolioItem[],
  stocks: ReadonlyMap<string, DividendStock>
): number {
  return items.reduce((sum, item) => {
    const stock = stocks.get(stockKey(item.market, item.ticker))
    return sum + (stock?.dividendYield ?? 0) * (item.weight / 100)
  }, 0)
}

function calcWeightedSafetyScore(
  items: readonly DividendPortfolioItem[],
  stocks: ReadonlyMap<string, DividendStock>
): number {
  if (items.length === 0) return DEFAULT_SAFETY_SCORE
  return items.reduce((sum, item) => {
    const stock = stocks.get(stockKey(item.market, item.ticker))
    return sum + (stock?.safetyScore ?? DEFAULT_SAFETY_SCORE) * (item.weight / 100)
  }, 0)
}

function calcDiversificationScore(
  sectorAllocation: readonly SectorAllocationEntry[]
): number {
  if (sectorAllocation.length === 0) return 0

  const hhi = sectorAllocation.reduce((sum, s) => {
    const share = s.weight / 100
    return sum + share * share
  }, 0)

  const minHhi = 1 / Math.max(sectorAllocation.length, 1)
  if (minHhi >= 1) return 100
  return Math.round(((1 - hhi) / (1 - minHhi)) * 100)
}

// ── 월별 스케줄 ──────────────────────────────

function buildMonthlySchedule(
  items: readonly DividendPortfolioItem[],
  stocks: ReadonlyMap<string, DividendStock>,
  annualInvestment: number
): readonly MonthlyScheduleEntry[] {
  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    const monthStocks = items
      .map((item) => {
        const stock = stocks.get(stockKey(item.market, item.ticker))
        if (!stock || !stock.paymentMonths.includes(month)) return null

        const paymentsPerYear = stock.paymentMonths.length || 1
        const itemInvestment = annualInvestment * (item.weight / 100)
        const amount = Math.round(
          (itemInvestment * (stock.dividendYield / 100)) / paymentsPerYear
        )

        return { ticker: item.ticker, name: stock.nameKr || stock.name, amount }
      })
      .filter(
        (s): s is { ticker: string; name: string; amount: number } => s !== null
      )

    return {
      month,
      stocks: monthStocks,
      totalAmount: monthStocks.reduce((sum, s) => sum + s.amount, 0),
    }
  })
}

// ── 연간 프로젝션 ──────────────────────────────

function buildYearlyProjection(
  settings: DividendPortfolioSettings,
  weightedYield: number,
  annualInvestment: number
): readonly YearlyProjectionEntry[] {
  const { period, drip, monthlyAdd, dividendGrowthRate } = settings
  const annualAddWon = monthlyAdd * WON_PER_MAN * 12

  // 3개 시나리오를 누적 계산 (금융 시뮬레이션 특성상 루프 필수)
  let dripValue = annualInvestment
  let dripCumDiv = 0
  let simpleCumDiv = 0
  let addValue = annualInvestment
  let addCumDiv = 0

  return Array.from({ length: period }, (_, i) => {
    const y = i + 1
    const yieldAtYear =
      weightedYield * Math.pow(1 + dividendGrowthRate / 100, y - 1)

    // DRIP 시나리오
    const dripDiv = dripValue * (yieldAtYear / 100)
    dripCumDiv += dripDiv
    if (drip) dripValue += dripDiv

    // 단순 수령
    const simpleDiv = annualInvestment * (yieldAtYear / 100)
    simpleCumDiv += simpleDiv

    // DRIP + 적립
    const addDiv = addValue * (yieldAtYear / 100)
    addCumDiv += addDiv
    addValue += addDiv + annualAddWon

    return {
      year: y,
      investedAmount: Math.round(annualInvestment + annualAddWon * (y - 1)),
      portfolioValue: Math.round(dripValue),
      annualDividend: Math.round(dripDiv),
      cumulativeDividend: Math.round(dripCumDiv),
      yieldOnCost:
        annualInvestment > 0
          ? Number(((dripDiv / annualInvestment) * 100).toFixed(2))
          : 0,
      cumulativeDividendSimple: Math.round(simpleCumDiv),
      portfolioValueWithAdd: Math.round(addValue),
      cumulativeDividendWithAdd: Math.round(addCumDiv),
    }
  })
}

// ── 섹터 배분 ──────────────────────────────

function buildSectorAllocation(
  items: readonly DividendPortfolioItem[]
): readonly SectorAllocationEntry[] {
  const sectorMap = new Map<string, { weight: number; count: number }>()

  for (const item of items) {
    const sector = item.sectorKr || "기타"
    const existing = sectorMap.get(sector) ?? { weight: 0, count: 0 }
    sectorMap.set(sector, {
      weight: existing.weight + item.weight,
      count: existing.count + 1,
    })
  }

  return Array.from(sectorMap.entries())
    .map(([sector, data]) => ({
      sector,
      weight: Number(data.weight.toFixed(1)),
      count: data.count,
    }))
    .sort((a, b) => b.weight - a.weight)
}

// ── 리스크 분석 (분리된 체크) ──────────────────

function checkSectorConcentration(
  sectorAllocation: readonly SectorAllocationEntry[]
): { risks: string[]; recommendations: string[] } {
  const topSector = sectorAllocation[0]
  if (topSector && topSector.weight > SECTOR_CONCENTRATION_THRESHOLD) {
    return {
      risks: [
        `${topSector.sector} 섹터에 ${topSector.weight.toFixed(0)}% 집중되어 있습니다.`,
      ],
      recommendations: ["섹터 분산을 위해 다른 업종의 배당주를 추가하세요."],
    }
  }
  return { risks: [], recommendations: [] }
}

function checkGapMonths(
  monthlySchedule: readonly MonthlyScheduleEntry[]
): { risks: string[]; recommendations: string[] } {
  const gapMonths = monthlySchedule.filter((m) => m.totalAmount === 0)
  if (gapMonths.length > 0) {
    const gapNames = gapMonths.map((m) => `${m.month}월`).join(", ")
    return {
      risks: [`${gapNames}에 배당 수령이 없습니다.`],
      recommendations: [
        "분기/월 배당 종목을 추가하여 공백월을 해소하세요.",
      ],
    }
  }
  return { risks: [], recommendations: [] }
}

function checkPayoutRisks(
  items: readonly DividendPortfolioItem[],
  stocks: ReadonlyMap<string, DividendStock>
): string[] {
  return items.reduce<string[]>((acc, item) => {
    const stock = stocks.get(stockKey(item.market, item.ticker))
    if (stock?.payoutRatio !== null && stock?.payoutRatio !== undefined && stock.payoutRatio > PAYOUT_RISK_THRESHOLD) {
      return [
        ...acc,
        `${stock.nameKr || stock.name}의 배당성향이 ${stock.payoutRatio}%로 높습니다.`,
      ]
    }
    return acc
  }, [])
}

function checkDiversification(
  items: readonly DividendPortfolioItem[]
): string[] {
  const recs: string[] = []
  if (items.length < MIN_DIVERSIFIED_COUNT) {
    recs.push("최소 5종목 이상으로 분산하면 리스크를 줄일 수 있습니다.")
  }

  const krWeight = items
    .filter((i) => i.market === "KR")
    .reduce((sum, i) => sum + i.weight, 0)
  const usWeight = items
    .filter((i) => i.market === "US")
    .reduce((sum, i) => sum + i.weight, 0)

  if (krWeight > 0 && usWeight > 0) {
    if (krWeight > MARKET_CONCENTRATION_THRESHOLD) {
      recs.push("해외 배당주를 추가하여 지역 분산을 고려하세요.")
    } else if (usWeight > MARKET_CONCENTRATION_THRESHOLD) {
      recs.push("국내 배당주를 추가하여 환율 리스크를 분산하세요.")
    }
  }
  return recs
}

function analyzeRisks(
  sectorAllocation: readonly SectorAllocationEntry[],
  monthlySchedule: readonly MonthlyScheduleEntry[],
  items: readonly DividendPortfolioItem[],
  stocks: ReadonlyMap<string, DividendStock>
): { risks: readonly string[]; recommendations: readonly string[] } {
  const sector = checkSectorConcentration(sectorAllocation)
  const gap = checkGapMonths(monthlySchedule)
  const payoutRisks = checkPayoutRisks(items, stocks)
  const diversRecs = checkDiversification(items)

  return {
    risks: [...sector.risks, ...gap.risks, ...payoutRisks],
    recommendations: [
      ...sector.recommendations,
      ...gap.recommendations,
      ...diversRecs,
    ],
  }
}

// ── 메인 ──────────────────────────────

export function simulatePortfolio(input: SimulationInput): DividendSimulation {
  const { settings, items, stocks } = input

  if (items.length === 0) {
    return {
      summary: {
        weightedYield: 0,
        annualDividend: 0,
        monthlyDividend: 0,
        totalDividend: 0,
        totalWithDrip: 0,
        safetyGrade: "C",
        diversificationScore: 0,
      },
      monthlySchedule: Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        stocks: [],
        totalAmount: 0,
      })),
      yearlyProjection: [],
      sectorAllocation: [],
      risks: [],
      recommendations: ["종목을 추가하여 배당 포트폴리오를 설계하세요."],
    }
  }

  const annualInvestment = settings.totalAmount * WON_PER_MAN
  const weightedYield = calcWeightedYield(items, stocks)
  const annualDividend = Math.round(annualInvestment * (weightedYield / 100))

  const monthlySchedule = buildMonthlySchedule(items, stocks, annualInvestment)
  const yearlyProjection = buildYearlyProjection(
    settings,
    weightedYield,
    annualInvestment
  )
  const sectorAllocation = buildSectorAllocation(items)
  const safetyScore = calcWeightedSafetyScore(items, stocks)
  const diversificationScore = calcDiversificationScore(sectorAllocation)

  const lastYear = yearlyProjection[yearlyProjection.length - 1]

  const { risks, recommendations } = analyzeRisks(
    sectorAllocation,
    monthlySchedule,
    items,
    stocks
  )

  return {
    summary: {
      weightedYield: Number(weightedYield.toFixed(2)),
      annualDividend,
      monthlyDividend: Math.round(annualDividend / 12),
      totalDividend: lastYear?.cumulativeDividendSimple ?? 0,
      totalWithDrip: lastYear?.cumulativeDividend ?? 0,
      safetyGrade: scoreToGrade(safetyScore),
      diversificationScore,
    },
    monthlySchedule,
    yearlyProjection,
    sectorAllocation,
    risks,
    recommendations,
  }
}
