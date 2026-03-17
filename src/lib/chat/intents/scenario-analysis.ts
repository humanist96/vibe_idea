/**
 * 시나리오 분석 인텐트 — 타입 + 시나리오 감지 + 컨텍스트 빌더
 *
 * 금리, 환율, 경기 등 매크로 시나리오에 따른
 * 포트폴리오 영향을 분석하기 위한 컨텍스트를 생성한다.
 */

import type { PortfolioItem } from "@/store/portfolio"
import type { MacroIndicator } from "@/lib/api/ecos-types"
import type { GlobalMacroIndicator } from "@/lib/api/fred-types"

// ── Types ──────────────────────────────────────────────────────

export type ScenarioType =
  | "rate_hike"
  | "rate_cut"
  | "krw_weaken"
  | "krw_strengthen"
  | "recession"
  | "inflation"
  | "custom"

export interface ScenarioAnalysisContext {
  readonly scenarioType: ScenarioType
  readonly scenarioDescription: string
  readonly portfolioItems: readonly PortfolioItem[]
  readonly sectorExposure: readonly {
    readonly sector: string
    readonly weight: number
    readonly sensitivity: "high" | "medium" | "low"
  }[]
  readonly marketAllocation: {
    readonly krWeight: number
    readonly usWeight: number
  }
  readonly currentMacro: {
    readonly baseRate: string | null
    readonly usdKrw: number | null
    readonly inflation: string | null
  }
}

// ── Scenario Detection ─────────────────────────────────────────

/** 사용자 메시지에서 시나리오 타입을 감지한다 */
export function detectScenarioType(message: string): ScenarioType {
  if (/금리.*(오르|인상|올라)/.test(message)) return "rate_hike"
  if (/금리.*(내리|인하|내려)/.test(message)) return "rate_cut"
  if (/원화.*(약세|하락)|달러.*(강세|상승|오르)/.test(message))
    return "krw_weaken"
  if (/원화.*(강세|상승)|달러.*(약세|하락|내리)/.test(message))
    return "krw_strengthen"
  if (/경기.*(침체|불황)/.test(message)) return "recession"
  if (/(인플레이션|물가).*(상승|급등)/.test(message)) return "inflation"
  return "custom"
}

// ── Scenario Labels ────────────────────────────────────────────

const SCENARIO_LABELS: Readonly<Record<ScenarioType, string>> = {
  rate_hike: "금리 인상 시나리오",
  rate_cut: "금리 인하 시나리오",
  krw_weaken: "원화 약세(달러 강세) 시나리오",
  krw_strengthen: "원화 강세(달러 약세) 시나리오",
  recession: "경기 침체 시나리오",
  inflation: "인플레이션 시나리오",
  custom: "사용자 정의 시나리오",
}

// ── Sector Sensitivity Mapping ─────────────────────────────────

const SECTOR_SCENARIO_SENSITIVITY: Readonly<
  Record<ScenarioType, Readonly<Record<string, "high" | "medium" | "low">>>
> = {
  rate_hike: {
    "금융": "high",
    "반도체": "medium",
    "바이오": "high",
    "부동산": "high",
    "유틸리티": "medium",
    "IT": "medium",
    "자동차": "low",
    "건설": "high",
  },
  rate_cut: {
    "금융": "medium",
    "반도체": "low",
    "바이오": "high",
    "부동산": "high",
    "IT": "medium",
    "건설": "high",
    "유틸리티": "low",
  },
  krw_weaken: {
    "반도체": "high",
    "자동차": "high",
    "금융": "low",
    "음식료": "medium",
    "에너지": "medium",
    "IT": "medium",
    "바이오": "low",
  },
  krw_strengthen: {
    "반도체": "high",
    "자동차": "high",
    "금융": "low",
    "음식료": "medium",
    "에너지": "medium",
    "바이오": "low",
  },
  recession: {
    "금융": "high",
    "반도체": "high",
    "바이오": "medium",
    "유틸리티": "low",
    "음식료": "low",
    "필수소비재": "low",
    "IT": "high",
    "건설": "high",
  },
  inflation: {
    "에너지": "high",
    "금융": "medium",
    "반도체": "medium",
    "음식료": "high",
    "유틸리티": "medium",
    "부동산": "medium",
    "바이오": "low",
  },
  custom: {},
}

// ── Context Builder ────────────────────────────────────────────

/** 시나리오 분석 컨텍스트를 프롬프트용 문자열로 변환 */
export function buildScenarioAnalysisContext(
  userMessage: string,
  portfolioItems: readonly PortfolioItem[],
  macro: {
    readonly korean: readonly MacroIndicator[]
    readonly global: readonly GlobalMacroIndicator[]
  }
): string {
  const scenarioType = detectScenarioType(userMessage)
  const lines: string[] = []

  lines.push(`[시나리오 분석: ${SCENARIO_LABELS[scenarioType]}]`)

  if (scenarioType === "custom") {
    lines.push(`가정: "${userMessage}"`)
  }

  // 현재 포트폴리오 구성
  lines.push("")
  lines.push("[현재 포트폴리오 구성]")

  // 섹터 배분 계산
  const sectorValues = new Map<string, number>()
  let totalValue = 0
  let krValue = 0
  let usValue = 0

  for (const item of portfolioItems) {
    const estimatedValue = item.avgPrice * item.quantity
    totalValue += estimatedValue
    sectorValues.set(
      item.sectorKr,
      (sectorValues.get(item.sectorKr) ?? 0) + estimatedValue
    )
    if (item.market === "KR") krValue += estimatedValue
    else usValue += estimatedValue
  }

  const sectorAllocation = [...sectorValues.entries()]
    .map(([sector, value]) => ({
      sector,
      weight: totalValue > 0 ? (value / totalValue) * 100 : 0,
    }))
    .sort((a, b) => b.weight - a.weight)

  const sectorStr = sectorAllocation
    .map((s) => `${s.sector}: ${s.weight.toFixed(1)}%`)
    .join(" | ")
  lines.push(sectorStr)

  const krWeight = totalValue > 0 ? (krValue / totalValue) * 100 : 0
  const usWeight = totalValue > 0 ? (usValue / totalValue) * 100 : 0
  lines.push(`KR: ${krWeight.toFixed(1)}% | US: ${usWeight.toFixed(1)}%`)

  // 현재 매크로 지표
  lines.push("")
  lines.push("[현재 매크로 지표]")

  const baseRate = macro.korean.find(
    (m) => m.name.includes("기준금리") || m.name.includes("금리")
  )
  const cpi = macro.korean.find(
    (m) => m.name.includes("소비자물가") || m.name.includes("CPI")
  )
  const usdKrw = macro.global.find(
    (m) => m.nameKr?.includes("달러") || m.nameKr?.includes("환율")
  )

  const macroLines: string[] = []
  if (baseRate) macroLines.push(`기준금리: ${baseRate.value}${baseRate.unit}`)
  if (usdKrw) macroLines.push(`USD/KRW: ${usdKrw.value}${usdKrw.unit}`)
  if (cpi) macroLines.push(`CPI: ${cpi.value}${cpi.unit}`)

  if (macroLines.length > 0) {
    lines.push(macroLines.join(" | "))
  } else {
    lines.push("매크로 데이터 조회 불가")
  }

  // 섹터별 민감도
  lines.push("")
  lines.push("[섹터별 민감도]")

  const sensitivityMap = SECTOR_SCENARIO_SENSITIVITY[scenarioType]

  for (const sector of sectorAllocation) {
    const sensitivity = sensitivityMap[sector.sector] ?? "low"
    const sensitivityKr =
      sensitivity === "high"
        ? "높음"
        : sensitivity === "medium"
          ? "중간"
          : "낮음"
    lines.push(
      `${sector.sector} (${sector.weight.toFixed(1)}%): ${sensitivityKr}`
    )
  }

  // 보유 종목 목록
  lines.push("")
  lines.push("[보유 종목]")
  for (const item of portfolioItems) {
    lines.push(
      `• ${item.name}(${item.ticker}) [${item.market}] — ${item.sectorKr} | 수량: ${item.quantity}`
    )
  }

  return "\n" + lines.join("\n")
}
