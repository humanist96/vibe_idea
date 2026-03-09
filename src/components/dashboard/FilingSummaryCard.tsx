"use client"

import { useState, useEffect } from "react"
import { FileSearch, Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react"
import Link from "next/link"

interface FilingSummary {
  ticker: string
  company: string
  type: string
  impact: string
  impactScore: number
  headline: string
  keyPoints: string[]
  investorAction: string
  priceImpact: string
}

interface FilingData {
  summaries: FilingSummary[]
  topAlert: { ticker: string; reason: string }
  summary: string
}

export function FilingSummaryCard() {
  const [data, setData] = useState<FilingData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchAndAnalyze = async () => {
      setLoading(true)
      try {
        const res = await fetch("/api/events?days=7")
        const json = await res.json()
        if (!json.success || !json.data?.length) return

        const filings = json.data.slice(0, 8).map((e: { rcept_dt?: string; stock_code?: string; corp_name?: string; report_nm?: string; flr_nm?: string }) => ({
          title: e.report_nm ?? "",
          company: e.corp_name ?? "",
          ticker: e.stock_code ?? "",
          type: e.flr_nm ?? "기타",
          date: e.rcept_dt ?? "",
        }))

        const aiRes = await fetch("/api/events/ai-summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filings }),
        })
        const aiJson = await aiRes.json()
        if (aiJson.success) setData(aiJson.data)
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    fetchAndAnalyze()
  }, [])

  const impactIcon = (impact: string) => {
    if (impact === "호재") return <TrendingUp className="h-3 w-3 text-emerald-400" />
    if (impact === "악재") return <TrendingDown className="h-3 w-3 text-red-400" />
    return <Minus className="h-3 w-3 text-gray-400" />
  }

  const actionColor = (a: string) => {
    if (a === "매수 검토") return "text-emerald-400 bg-emerald-500/10"
    if (a === "비중 축소") return "text-red-400 bg-red-500/10"
    if (a === "보유 유지") return "text-blue-400 bg-blue-500/10"
    return "text-gray-400 bg-gray-500/10"
  }

  return (
    <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4">
      <div className="flex items-center gap-2">
        <FileSearch className="h-4 w-4 text-teal-400" />
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">공시 AI 요약</h3>
      </div>

      {loading && (
        <div className="mt-4 flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--color-text-tertiary)]" />
        </div>
      )}

      {!loading && !data && (
        <p className="mt-3 text-xs text-[var(--color-text-tertiary)]">최근 공시가 없습니다.</p>
      )}

      {data && (
        <div className="mt-3 space-y-2">
          {/* Top alert */}
          {data.topAlert && (
            <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-2 text-[11px]">
              <span className="font-medium text-amber-400">주목 공시:</span>{" "}
              <span className="text-[var(--color-text-secondary)]">{data.topAlert.reason}</span>
            </div>
          )}

          {data.summaries.slice(0, 4).map((s, i) => (
            <Link key={i} href={`/stock/${s.ticker}`} className="block rounded-lg bg-[var(--color-surface-elevated)] p-2.5 transition-colors hover:bg-[var(--color-surface-elevated)]/80">
              <div className="flex items-center gap-2">
                {impactIcon(s.impact)}
                <span className="text-xs font-medium text-[var(--color-text-primary)]">{s.company}</span>
                <span className="text-[9px] text-[var(--color-text-tertiary)]">{s.type}</span>
                <div className="ml-auto flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <div key={j} className={`h-1 w-1 rounded-full ${j < s.impactScore ? "bg-teal-400" : "bg-[var(--color-border-default)]"}`} />
                  ))}
                </div>
              </div>
              <p className="mt-1 text-[10px] text-[var(--color-text-secondary)]">{s.headline}</p>
              <span className={`mt-1 inline-block rounded-full px-1.5 py-0.5 text-[9px] font-medium ${actionColor(s.investorAction)}`}>
                {s.investorAction}
              </span>
            </Link>
          ))}

          <p className="text-[10px] text-[var(--color-text-tertiary)]">{data.summary}</p>
        </div>
      )}
    </div>
  )
}
