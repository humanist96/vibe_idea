/**
 * 보고서 요약 인텐트 — 타입 + 컨텍스트 빌더
 *
 * 클라이언트에서 직렬화해 전달한 ReportSummaryPayload를
 * 프롬프트용 문자열로 변환한다.
 */

import type { ReportMeta } from "@/lib/report/types"

// ── Types ──────────────────────────────────────────────────────

export interface ReportSummaryPayload {
  readonly meta: ReportMeta
  readonly executiveSummary: string
  readonly portfolioInsight: string
  readonly watchPoints: readonly string[]
  readonly stockSummaries: readonly {
    readonly ticker: string
    readonly name: string
    readonly outlook: string
    readonly riskLevel: string
  }[]
}

export interface ReportSummaryContext {
  readonly meta: ReportMeta
  readonly executiveSummary: string
  readonly portfolioInsight: string
  readonly watchPoints: readonly string[]
  readonly topStockSummaries: readonly {
    readonly ticker: string
    readonly name: string
    readonly outlook: string
    readonly riskLevel: "critical" | "warning" | "info" | "none"
  }[]
  readonly marketSnapshot: {
    readonly date: string
    readonly fearGreedValue: number | null
    readonly fearGreedLabel: string | null
  }
}

// ── Context Builder ────────────────────────────────────────────

/** ReportSummaryPayload를 프롬프트용 문자열로 변환 */
export function buildReportSummaryContext(
  payload: ReportSummaryPayload
): string {
  const lines: string[] = []

  const date = payload.meta.date
  const generatedTime = payload.meta.generatedAt
    ? new Date(payload.meta.generatedAt).toLocaleString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "알 수 없음"

  lines.push(`[데일리 보고서 요약 — ${date}]`)
  lines.push(
    `생성 시각: ${generatedTime} | 분석 종목: ${payload.meta.stockCount}개`
  )

  // 종합 요약
  if (payload.executiveSummary) {
    lines.push("")
    lines.push("[종합 요약]")
    lines.push(payload.executiveSummary)
  }

  // 포트폴리오 인사이트
  if (payload.portfolioInsight) {
    lines.push("")
    lines.push("[포트폴리오 인사이트]")
    lines.push(payload.portfolioInsight)
  }

  // 종목별 현황
  if (payload.stockSummaries.length > 0) {
    lines.push("")
    lines.push("[종목별 현황]")
    for (const stock of payload.stockSummaries) {
      const riskLabel = formatRiskLevel(stock.riskLevel)
      lines.push(
        `• ${stock.name}(${stock.ticker}): ${riskLabel} | ${stock.outlook}`
      )
    }
  }

  // 주목 포인트
  if (payload.watchPoints.length > 0) {
    lines.push("")
    lines.push("[주목 포인트]")
    payload.watchPoints.forEach((point, i) => {
      lines.push(`${i + 1}. ${point}`)
    })
  }

  return "\n" + lines.join("\n")
}

function formatRiskLevel(level: string): string {
  switch (level) {
    case "critical":
      return "위험"
    case "warning":
      return "주의"
    case "info":
      return "정보"
    case "none":
      return "긍정적"
    default:
      return "정보"
  }
}
