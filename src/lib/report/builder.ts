/**
 * Phase 3: 보고서 데이터 조립 + 메타데이터 생성
 */

import type { AnalyzedReportData, ReportMeta, ReportProgress } from "./types"

/** 보고서 메타데이터 생성 */
export function buildReportMeta(report: AnalyzedReportData): ReportMeta {
  return {
    id: `daily-${report.date}`,
    date: report.date,
    generatedAt: report.generatedAt,
    stockCount: report.stocks.length,
    summary: report.executiveSummary.slice(0, 200),
    tickers: report.stocks.map((s) => s.ticker),
  }
}

/** Phase 3 실행 — 메타데이터 생성 및 진행 상태 완료 */
export function finalizeReport(
  analyzed: AnalyzedReportData,
  onProgress?: (p: ReportProgress) => void
): { meta: ReportMeta; data: AnalyzedReportData } {
  onProgress?.({ phase: "building", progress: 85, message: "보고서 조립 중..." })

  const meta = buildReportMeta(analyzed)

  onProgress?.({
    phase: "complete",
    progress: 100,
    message: "보고서 생성 완료",
    reportId: meta.id,
  })

  return { meta, data: analyzed }
}
