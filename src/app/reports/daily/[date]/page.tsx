"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { DailyReport } from "@/components/reports/DailyReport"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { useReportHistoryStore } from "@/store/report-history"
import type { AnalyzedReportData } from "@/lib/report/types"
import { FileText } from "lucide-react"
import Link from "next/link"

export default function DailyReportPage() {
  const params = useParams<{ date: string }>()
  const date = params.date
  const [report, setReport] = useState<AnalyzedReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const getReport = useReportHistoryStore((s) => s.getReport)

  useEffect(() => {
    const reportId = `daily-${date}`
    const cached = getReport(reportId)
    if (cached) {
      setReport(cached)
    }
    setLoading(false)
  }, [date, getReport])

  if (loading) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton className="h-12 w-full rounded-xl" />
        <LoadingSkeleton className="h-64 w-full rounded-xl" />
        <LoadingSkeleton className="h-48 w-full rounded-xl" />
      </div>
    )
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center py-20">
        <FileText className="mb-4 h-10 w-10 text-[var(--color-text-muted)]" />
        <p className="text-sm text-[var(--color-text-secondary)]">
          {date} 보고서를 찾을 수 없습니다.
        </p>
        <Link href="/reports" className="mt-4 text-sm text-[var(--color-accent-500)] hover:underline">
          보고서 목록으로
        </Link>
      </div>
    )
  }

  return <DailyReport report={report} />
}
