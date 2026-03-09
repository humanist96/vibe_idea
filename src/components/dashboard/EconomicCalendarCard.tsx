"use client"

import { useState } from "react"
import { Calendar, Loader2, AlertTriangle, Shield } from "lucide-react"

interface CalendarImpactData {
  events: Array<{
    date: string
    name: string
    importance: string
    expectedImpact: string
    affectedSectors: string[]
    scenario: { positive: string; negative: string }
  }>
  weekRiskLevel: string
  portfolioAlerts: Array<{ ticker: string; name: string; event: string; risk: string }>
  tradingStrategy: string
  summary: string
}

const SAMPLE_EVENTS = [
  { date: "이번주", name: "FOMC 회의록 공개", country: "US" },
  { date: "이번주", name: "소비자물가지수(CPI)", country: "US" },
  { date: "이번주", name: "고용보험 청구건수", country: "US" },
  { date: "이번주", name: "한국은행 기준금리", country: "KR" },
  { date: "이번주", name: "산업생산지수", country: "KR" },
]

export function EconomicCalendarCard() {
  const [data, setData] = useState<CalendarImpactData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const analyze = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/macro/calendar-impact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: SAMPLE_EVENTS }),
      })
      const json = await res.json()
      if (json.success) setData(json.data)
      else setError(json.error || "분석 실패")
    } catch {
      setError("네트워크 오류")
    } finally {
      setLoading(false)
    }
  }

  const riskColor = (r: string) => {
    if (r === "높음") return "text-red-400 bg-red-500/10"
    if (r === "보통") return "text-amber-400 bg-amber-500/10"
    return "text-emerald-400 bg-emerald-500/10"
  }

  const importanceColor = (i: string) => {
    if (i === "높음") return "bg-red-500"
    if (i === "보통") return "bg-amber-500"
    return "bg-gray-500"
  }

  return (
    <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-orange-400" />
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">경제 캘린더 임팩트</h3>
        </div>
        {!data && (
          <button
            onClick={analyze}
            disabled={loading}
            className="rounded-lg bg-orange-500/10 px-3 py-1.5 text-xs font-medium text-orange-400 transition-colors hover:bg-orange-500/20 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "분석하기"}
          </button>
        )}
      </div>

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      {data && (
        <div className="mt-3 space-y-3">
          {/* Risk level */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[var(--color-text-tertiary)]">이번 주 리스크:</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${riskColor(data.weekRiskLevel)}`}>
              {data.weekRiskLevel}
            </span>
          </div>

          {/* Events */}
          <div className="space-y-1.5">
            {data.events.slice(0, 4).map((e, i) => (
              <div key={i} className="rounded-lg bg-[var(--color-surface-elevated)] p-2">
                <div className="flex items-center gap-2">
                  <div className={`h-1.5 w-1.5 rounded-full ${importanceColor(e.importance)}`} />
                  <span className="text-xs font-medium text-[var(--color-text-primary)]">{e.name}</span>
                  <span className="ml-auto text-[9px] text-[var(--color-text-tertiary)]">{e.date}</span>
                </div>
                <p className="mt-0.5 text-[10px] text-[var(--color-text-secondary)] ml-3.5">{e.expectedImpact}</p>
                {e.affectedSectors.length > 0 && (
                  <div className="mt-1 ml-3.5 flex flex-wrap gap-1">
                    {e.affectedSectors.map((s, j) => (
                      <span key={j} className="rounded bg-[var(--color-surface-card)] px-1 py-0.5 text-[8px] text-[var(--color-text-tertiary)]">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Strategy */}
          <div className="rounded-lg bg-orange-500/5 border border-orange-500/20 p-2.5">
            <div className="flex items-center gap-1 text-[10px] font-medium text-orange-400 mb-1">
              <Shield className="h-3 w-3" /> 대응 전략
            </div>
            <p className="text-[11px] text-[var(--color-text-secondary)]">{data.tradingStrategy}</p>
          </div>

          <p className="text-[10px] text-[var(--color-text-tertiary)]">{data.summary}</p>
        </div>
      )}
    </div>
  )
}
