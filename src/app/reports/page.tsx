"use client"

import { useState, useCallback, useEffect } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Card } from "@/components/ui/Card"
import { useReportHistoryStore } from "@/store/report-history"
import { useWeeklyReportHistoryStore } from "@/store/weekly-report-history"
import { useWatchlistStore } from "@/store/watchlist"
import { FileText, Plus, Trash2, Clock, BarChart3, Calendar, Lock } from "lucide-react"
import type { AnalyzedReportData, ReportMeta } from "@/lib/report/types"
import type { WeeklyAnalyzedData, WeeklyReportMeta } from "@/lib/report/weekly-types"

type TabType = "daily" | "weekly"

export default function ReportsPage() {
  const { status } = useSession()
  const [activeTab, setActiveTab] = useState<TabType>("daily")

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-accent-500)]/30 border-t-[var(--color-accent-500)]" />
      </div>
    )
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex flex-col items-center py-20">
        <Lock className="mb-4 h-10 w-10 text-[var(--color-text-muted)]" />
        <p className="text-sm font-medium text-[var(--color-text-secondary)]">
          로그인이 필요한 서비스입니다
        </p>
        <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
          개인 맞춤 투자 보고서는 로그인 후 이용할 수 있습니다
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--color-accent-500)] px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-[var(--color-accent-600)]"
        >
          로그인하기
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          투자 보고서
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
          관심종목 기반 AI 투자 분석 보고서
        </p>
      </div>

      {/* Tabs */}
      <div className="animate-fade-up stagger-1 flex gap-1 rounded-lg bg-[var(--color-surface-50)] p-1">
        <button
          type="button"
          onClick={() => setActiveTab("daily")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${
            activeTab === "daily"
              ? "bg-white text-[var(--color-text-primary)] shadow-sm"
              : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
          }`}
        >
          <FileText className="mr-1.5 inline-block h-4 w-4" />
          일간
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("weekly")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${
            activeTab === "weekly"
              ? "bg-white text-[var(--color-text-primary)] shadow-sm"
              : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
          }`}
        >
          <Calendar className="mr-1.5 inline-block h-4 w-4" />
          주간
        </button>
      </div>

      {activeTab === "daily" ? <DailyReportsTab /> : <WeeklyReportsTab />}
    </div>
  )
}

/* ── Daily Reports Tab ───────────────────────────────────── */

function DailyReportsTab() {
  const reports = useReportHistoryStore((s) => s.reports)
  const addReport = useReportHistoryStore((s) => s.addReport)
  const deleteReportFromServer = useReportHistoryStore((s) => s.deleteReportFromServer)
  const fetchReports = useReportHistoryStore((s) => s.fetchReports)
  const loading = useReportHistoryStore((s) => s.loading)
  const tickers = useWatchlistStore((s) => s.tickers)

  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState("")

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const handleGenerate = useCallback(async () => {
    if (tickers.length === 0 || generating) return

    setGenerating(true)
    setProgress("보고서 생성 중... (1-2분 소요)")

    try {
      const res = await fetch("/api/reports/daily/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tickers }),
      })

      if (res.status === 401) {
        setProgress("로그인이 필요합니다.")
        return
      }

      const json = await res.json()

      if (json.success && json.data) {
        const { meta, report } = json.data as { meta: ReportMeta; report: AnalyzedReportData }
        addReport(meta, report)
        setProgress("완료!")
        window.location.href = `/reports/daily/${report.date}`
      } else {
        setProgress(`오류: ${json.error ?? "알 수 없는 오류"}`)
      }
    } catch {
      setProgress("네트워크 오류가 발생했습니다.")
    } finally {
      setGenerating(false)
    }
  }, [tickers, generating, addReport])

  if (loading && reports.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-accent-500)]/30 border-t-[var(--color-accent-500)]" />
      </div>
    )
  }

  return (
    <>
      <GenerateButton
        onGenerate={handleGenerate}
        generating={generating}
        tickerCount={tickers.length}
        progress={progress}
        label="새 일간 보고서 생성"
        durationHint="약 1-2분 소요"
      />

      {reports.length === 0 ? (
        <EmptyState icon={<BarChart3 className="mb-4 h-10 w-10 text-[var(--color-text-muted)]" />} />
      ) : (
        <div className="animate-fade-up stagger-2 space-y-3">
          {reports.map((report) => (
            <ReportCard
              key={report.id}
              href={`/reports/daily/${report.date}`}
              title={new Date(report.date).toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
              subtitle={`${report.stockCount}개 종목 분석`}
              summary={report.summary}
              time={new Date(report.generatedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
              iconColor="amber"
              onDelete={() => deleteReportFromServer(report.id)}
            />
          ))}
        </div>
      )}
    </>
  )
}

/* ── Weekly Reports Tab ──────────────────────────────────── */

function WeeklyReportsTab() {
  const reports = useWeeklyReportHistoryStore((s) => s.reports)
  const addReport = useWeeklyReportHistoryStore((s) => s.addReport)
  const deleteReportFromServer = useWeeklyReportHistoryStore((s) => s.deleteReportFromServer)
  const fetchReports = useWeeklyReportHistoryStore((s) => s.fetchReports)
  const loading = useWeeklyReportHistoryStore((s) => s.loading)
  const tickers = useWatchlistStore((s) => s.tickers)

  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState("")

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const handleGenerate = useCallback(async () => {
    if (tickers.length === 0 || generating) return

    setGenerating(true)
    setProgress("주간 보고서 생성 중... (2-3분 소요)")

    try {
      const res = await fetch("/api/reports/weekly/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tickers }),
      })

      if (res.status === 401) {
        setProgress("로그인이 필요합니다.")
        return
      }

      const json = await res.json()

      if (json.success && json.data) {
        const { meta, report } = json.data as { meta: WeeklyReportMeta; report: WeeklyAnalyzedData }
        addReport(meta, report)
        setProgress("완료!")
        window.location.href = `/reports/weekly/${meta.weekStart}`
      } else {
        setProgress(`오류: ${json.error ?? "알 수 없는 오류"}`)
      }
    } catch {
      setProgress("네트워크 오류가 발생했습니다.")
    } finally {
      setGenerating(false)
    }
  }, [tickers, generating, addReport])

  if (loading && reports.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-accent-500)]/30 border-t-[var(--color-accent-500)]" />
      </div>
    )
  }

  return (
    <>
      <GenerateButton
        onGenerate={handleGenerate}
        generating={generating}
        tickerCount={tickers.length}
        progress={progress}
        label="새 주간 보고서 생성"
        durationHint="약 2-3분 소요"
      />

      {reports.length === 0 ? (
        <EmptyState icon={<Calendar className="mb-4 h-10 w-10 text-[var(--color-text-muted)]" />} />
      ) : (
        <div className="animate-fade-up stagger-2 space-y-3">
          {reports.map((report) => (
            <ReportCard
              key={report.id}
              href={`/reports/weekly/${(report as WeeklyReportMeta).weekStart}`}
              title={`${formatDate((report as WeeklyReportMeta).weekStart)} ~ ${formatDate((report as WeeklyReportMeta).weekEnd)}`}
              subtitle={`${report.stockCount}개 종목 주간 분석`}
              summary={report.summary}
              time={new Date(report.generatedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
              iconColor="blue"
              onDelete={() => deleteReportFromServer(report.id)}
            />
          ))}
        </div>
      )}
    </>
  )
}

/* ── Shared Components ───────────────────────────────────── */

function GenerateButton({
  onGenerate,
  generating,
  tickerCount,
  progress,
  label,
  durationHint,
}: {
  readonly onGenerate: () => void
  readonly generating: boolean
  readonly tickerCount: number
  readonly progress: string
  readonly label: string
  readonly durationHint: string
}) {
  return (
    <div className="animate-fade-up stagger-1">
      <button
        type="button"
        onClick={onGenerate}
        disabled={generating || tickerCount === 0}
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
            {label}
          </>
        )}
      </button>

      {tickerCount === 0 && (
        <p className="mt-2 text-xs text-[var(--color-text-muted)]">
          관심종목을 먼저 추가해주세요.{" "}
          <Link href="/watchlist" className="text-[var(--color-accent-500)] hover:underline">
            관심종목 관리
          </Link>
        </p>
      )}

      {tickerCount > 0 && !generating && (
        <p className="mt-2 text-xs text-[var(--color-text-muted)]">
          관심종목 {tickerCount}개에 대한 보고서를 생성합니다. ({durationHint})
        </p>
      )}

      {progress && (
        <p className="mt-2 text-xs text-[var(--color-accent-500)]">{progress}</p>
      )}
    </div>
  )
}

function EmptyState({ icon }: { readonly icon: React.ReactNode }) {
  return (
    <Card className="animate-fade-up stagger-2">
      <div className="flex flex-col items-center py-16">
        {icon}
        <p className="text-sm text-[var(--color-text-secondary)]">
          아직 생성된 보고서가 없습니다
        </p>
        <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
          위 버튼을 눌러 보고서를 생성해보세요
        </p>
      </div>
    </Card>
  )
}

function ReportCard({
  href,
  title,
  subtitle,
  summary,
  time,
  iconColor,
  onDelete,
}: {
  readonly href: string
  readonly title: string
  readonly subtitle: string
  readonly summary: string
  readonly time: string
  readonly iconColor: "amber" | "blue"
  readonly onDelete: () => void
}) {
  const bgMap = { amber: "bg-amber-50", blue: "bg-blue-50" } as const
  const textMap = { amber: "text-amber-500", blue: "text-blue-500" } as const

  return (
    <Link href={href} className="glass-card block rounded-xl p-4 transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${bgMap[iconColor]}`}>
            {iconColor === "amber" ? (
              <FileText className={`h-4 w-4 ${textMap[iconColor]}`} />
            ) : (
              <Calendar className={`h-4 w-4 ${textMap[iconColor]}`} />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--color-text-primary)]">{title}</p>
            <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">{subtitle}</p>
            <p className="mt-1 line-clamp-2 text-xs text-[var(--color-text-secondary)]">{summary}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)]">
            <Clock className="h-3 w-3" />
            {time}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onDelete()
            }}
            className="rounded-full p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-100)] hover:text-[var(--color-text-secondary)]"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </Link>
  )
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" })
}
