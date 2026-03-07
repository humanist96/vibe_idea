"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/Card"
import { USDailyReport } from "@/components/us-reports/USDailyReport"
import {
  useUSReportHistoryStore,
  type USReportMeta,
  type USReportData,
} from "@/store/us-report-history"
import { useUSWatchlistStore } from "@/store/us-watchlist"
import { FileText, Plus, Trash2, Clock, BarChart3, ArrowLeft } from "lucide-react"

export default function USReportsPage() {
  const reports = useUSReportHistoryStore((s) => s.reports)
  const addReport = useUSReportHistoryStore((s) => s.addReport)
  const deleteReport = useUSReportHistoryStore((s) => s.deleteReport)
  const getReport = useUSReportHistoryStore((s) => s.getReport)
  const tickers = useUSWatchlistStore((s) => s.tickers)

  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState("")
  const [viewingReport, setViewingReport] = useState<USReportData | null>(null)

  const handleGenerate = useCallback(async () => {
    if (tickers.length === 0 || generating) return

    setGenerating(true)
    setProgress("데이터 수집 중... (시세, 기술지표, 뉴스, 매크로)")

    try {
      const res = await fetch("/api/us-stocks/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbols: tickers }),
      })

      setProgress("AI 분석 중...")

      const json = await res.json()

      if (json.success && json.data) {
        const { meta, report } = json.data as {
          meta: USReportMeta
          report: USReportData
        }
        addReport(meta, report)
        setProgress("")
        setViewingReport(report)
      } else {
        setProgress(`오류: ${json.error ?? "알 수 없는 오류"}`)
      }
    } catch {
      setProgress("네트워크 오류가 발생했습니다.")
    } finally {
      setGenerating(false)
    }
  }, [tickers, generating, addReport])

  const handleViewReport = (id: string) => {
    const report = getReport(id)
    if (report) setViewingReport(report)
  }

  /* ── Report Detail View ── */
  if (viewingReport) {
    return (
      <div className="space-y-6">
        <div className="animate-fade-up flex items-center gap-3">
          <button
            type="button"
            onClick={() => setViewingReport(null)}
            className="inline-flex items-center gap-1 text-sm text-[var(--color-accent-500)] hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            목록으로
          </button>
        </div>

        <USDailyReport report={viewingReport} />
      </div>
    )
  }

  /* ── Report List View ── */
  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          US 데일리 보고서
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
          관심종목 기반 AI 투자 분석 보고서
        </p>
      </div>

      {/* Generate Button */}
      <div className="animate-fade-up stagger-1">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating || tickers.length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-accent-500)] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-[var(--color-accent-600)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {generating ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              생성 중...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              새 보고서 생성
            </>
          )}
        </button>

        {tickers.length === 0 && (
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">
            관심종목을 먼저 추가해주세요.{" "}
            <Link
              href="/watchlist"
              className="text-[var(--color-accent-500)] hover:underline"
            >
              관심종목 관리
            </Link>
          </p>
        )}

        {tickers.length > 0 && !generating && (
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">
            관심종목 {tickers.length}개에 대한 보고서를 생성합니다. (약 1-2분
            소요)
          </p>
        )}

        {progress && (
          <div className="mt-3 flex items-center gap-2">
            {generating && (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--color-accent-300)] border-t-[var(--color-accent-500)]" />
            )}
            <p className="text-xs text-[var(--color-accent-500)]">{progress}</p>
          </div>
        )}
      </div>

      {/* Report List */}
      {reports.length === 0 ? (
        <Card className="animate-fade-up stagger-2">
          <div className="flex flex-col items-center py-16">
            <BarChart3 className="mb-4 h-10 w-10 text-[var(--color-text-muted)]" />
            <p className="text-sm text-[var(--color-text-secondary)]">
              아직 생성된 보고서가 없습니다
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
              위 버튼을 눌러 첫 번째 보고서를 생성해보세요
            </p>
          </div>
        </Card>
      ) : (
        <div className="animate-fade-up stagger-2 space-y-3">
          {reports.map((report) => (
            <button
              key={report.id}
              type="button"
              onClick={() => handleViewReport(report.id)}
              className="glass-card block w-full rounded-xl p-4 text-left transition-all hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
                    <FileText className="h-4 w-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">
                      {new Date(report.date).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
                      {report.stockCount}개 종목 분석
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-[var(--color-text-secondary)]">
                      {report.summary}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)]">
                    <Clock className="h-3 w-3" />
                    {new Date(report.generatedAt).toLocaleTimeString("ko-KR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      deleteReport(report.id)
                    }}
                    className="rounded-full p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-100)] hover:text-[var(--color-text-secondary)]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
