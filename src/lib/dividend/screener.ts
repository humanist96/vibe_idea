/**
 * 배당 스크리너 로직
 * - 전략 프리셋 매핑
 * - 다차원 필터링
 * - 정렬 및 페이지네이션
 */

import type {
  DividendStock,
  DividendScreenerFilters,
  DividendScreenerPreset,
  DividendScreenerResponse,
  DividendSortField,
  DividendMarket,
} from "./dividend-types"

// ── 프리셋 정의 ──────────────────────────────

type PresetFilters = Partial<DividendScreenerFilters>

const PRESETS: Readonly<Record<DividendScreenerPreset, PresetFilters>> = {
  "high-yield": {
    yieldMin: 4,
    yieldMax: 15,
  },
  growth: {
    consecutiveYearsMin: 3,
    growthRateMin: 5,
  },
  safety: {
    payoutRatioMax: 60,
  },
  aristocrat: {
    consecutiveYearsMin: 10,
  },
  monthly: {
    frequency: ["quarterly", "monthly"],
  },
  value: {
    yieldMin: 3,
    // perMax/pbrMax: DividendStock에 PER/PBR 데이터 추가 시 활성화
  },
}

function getPresetFilters(
  preset: DividendScreenerPreset | null,
  market: DividendMarket | "ALL"
): PresetFilters {
  if (!preset) return {}
  const base = { ...PRESETS[preset] }

  // aristocrat: KR=10년, US=25년 기준 차별
  if (preset === "aristocrat" && market === "US") {
    return { ...base, consecutiveYearsMin: 25 }
  }

  return base
}

// ── 필터링 ──────────────────────────────

function mergeFilters(
  preset: PresetFilters,
  userFilters: Partial<DividendScreenerFilters>
): DividendScreenerFilters {
  return {
    market: userFilters.market ?? "ALL",
    preset: null,
    yieldMin: userFilters.yieldMin ?? preset.yieldMin ?? 0,
    yieldMax: userFilters.yieldMax ?? preset.yieldMax ?? 100,
    payoutRatioMax:
      userFilters.payoutRatioMax ?? preset.payoutRatioMax ?? null,
    consecutiveYearsMin:
      userFilters.consecutiveYearsMin ?? preset.consecutiveYearsMin ?? 0,
    growthRateMin:
      userFilters.growthRateMin ?? preset.growthRateMin ?? null,
    marketCapMin:
      userFilters.marketCapMin ?? preset.marketCapMin ?? null,
    sectors: userFilters.sectors ?? preset.sectors ?? [],
    frequency: userFilters.frequency ?? preset.frequency ?? [],
    debtToEquityMax:
      userFilters.debtToEquityMax ?? preset.debtToEquityMax ?? null,
    fcfCoverageMin:
      userFilters.fcfCoverageMin ?? preset.fcfCoverageMin ?? null,
    perMax: userFilters.perMax ?? preset.perMax ?? null,
    pbrMax: userFilters.pbrMax ?? preset.pbrMax ?? null,
  }
}

function matchesFilter(
  stock: DividendStock,
  filters: DividendScreenerFilters
): boolean {
  // 배당률 범위
  if (stock.dividendYield < filters.yieldMin) return false
  if (stock.dividendYield > filters.yieldMax) return false

  // 배당성향
  if (
    filters.payoutRatioMax !== null &&
    stock.payoutRatio !== null &&
    stock.payoutRatio > filters.payoutRatioMax
  ) {
    return false
  }

  // 연속 배당 증가 연수
  if (stock.consecutiveYears < filters.consecutiveYearsMin) return false

  // 배당 성장률
  if (
    filters.growthRateMin !== null &&
    (stock.dividendGrowthRate === null ||
      stock.dividendGrowthRate < filters.growthRateMin)
  ) {
    return false
  }

  // 섹터 필터
  if (
    filters.sectors.length > 0 &&
    !filters.sectors.includes(stock.sector) &&
    !filters.sectors.includes(stock.sectorKr)
  ) {
    return false
  }

  // 배당 빈도
  if (
    filters.frequency.length > 0 &&
    !filters.frequency.includes(stock.frequency)
  ) {
    return false
  }

  // 부채비율
  if (
    filters.debtToEquityMax !== null &&
    stock.debtToEquity !== null &&
    stock.debtToEquity > filters.debtToEquityMax
  ) {
    return false
  }

  // FCF 커버리지
  if (
    filters.fcfCoverageMin !== null &&
    stock.fcfCoverage !== null &&
    stock.fcfCoverage < filters.fcfCoverageMin
  ) {
    return false
  }

  return true
}

// ── 정렬 ──────────────────────────────

function getSortValue(stock: DividendStock, field: DividendSortField): number {
  switch (field) {
    case "yield":
      return stock.dividendYield
    case "growthRate":
      return stock.dividendGrowthRate ?? 0
    case "safetyScore":
      return stock.safetyScore
    case "consecutiveYears":
      return stock.consecutiveYears
    case "dividendPerShare":
      return stock.dividendPerShare
    case "marketCap":
      return 0 // 시총 데이터 별도 조회 필요
    default:
      return stock.dividendYield
  }
}

// ── 메인 함수 ──────────────────────────────

export function applyScreenerFilters(
  stocks: readonly DividendStock[],
  preset: DividendScreenerPreset | null,
  userFilters: Partial<DividendScreenerFilters>,
  market: DividendStock["market"] | "ALL",
  sort: DividendSortField = "yield",
  order: "asc" | "desc" = "desc",
  page: number = 1,
  limit: number = 20
): DividendScreenerResponse {
  const presetFilters = getPresetFilters(preset, market)
  const filters = mergeFilters(presetFilters, userFilters)

  // 시장 필터
  let filtered = market === "ALL"
    ? [...stocks]
    : stocks.filter((s) => s.market === market)

  // 필터 적용
  filtered = filtered.filter((s) => matchesFilter(s, filters))

  // 정렬
  const sorted = [...filtered].sort((a, b) => {
    const aVal = getSortValue(a, sort)
    const bVal = getSortValue(b, sort)
    return order === "desc" ? bVal - aVal : aVal - bVal
  })

  // 페이지네이션
  const total = sorted.length
  const start = (page - 1) * limit
  const paged = sorted.slice(start, start + limit)

  return {
    data: paged,
    meta: { total, page, limit },
  }
}
