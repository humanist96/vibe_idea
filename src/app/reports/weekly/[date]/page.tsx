"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { WeeklyReport } from "@/components/reports/WeeklyReport"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { useWeeklyReportHistoryStore } from "@/store/weekly-report-history"
import type { WeeklyAnalyzedData } from "@/lib/report/weekly-types"
import { FileText, Lock } from "lucide-react"

export default function WeeklyReportPage() {
  const params = useParams<{ date: string }>()
  const date = params.date
  const { status } = useSession()
  const [report, setReport] = useState<WeeklyAnalyzedData | null>(null)
  const [loading, setLoading] = useState(true)
  const fetchReportDetail = useWeeklyReportHistoryStore((s) => s.fetchReportDetail)

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      setLoading(false)
      return
    }

    const reportId = `weekly-${date}`
    fetchReportDetail(reportId).then((data) => {
      if (data) setReport(data)
      setLoading(false)
    })
  }, [date, status, fetchReportDetail])

  if (status === "loading" || loading) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton className="h-12 w-full rounded-xl" />
        <LoadingSkeleton className="h-64 w-full rounded-xl" />
        <LoadingSkeleton className="h-48 w-full rounded-xl" />
      </div>
    )
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex flex-col items-center py-20">
        <Lock className="mb-4 h-10 w-10 text-[var(--color-text-muted)]" />
        <p className="text-sm font-medium text-[var(--color-text-secondary)]">
          로그인이 필요합니다
        </p>
        <Link
          href="/login"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--color-accent-500)] px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-[var(--color-accent-600)]"
        >
          로그인하기
        </Link>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center py-20">
        <FileText className="mb-4 h-10 w-10 text-[var(--color-text-muted)]" />
        <p className="text-sm text-[var(--color-text-secondary)]">
          {date} 주간 보고서를 찾을 수 없습니다.
        </p>
        <Link href="/reports" className="mt-4 text-sm text-[var(--color-accent-500)] hover:underline">
          보고서 목록으로
        </Link>
      </div>
    )
  }

  return <WeeklyReport report={report} />
}
