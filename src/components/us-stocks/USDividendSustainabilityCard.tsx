"use client"

import { useState } from "react"
import { BadgeDollarSign, Loader2, Shield, TrendingUp } from "lucide-react"
import { formatUSD } from "@/lib/utils/format"

interface SustainabilityData {
  sustainabilityScore: number
  grade: string
  dividendSafety: string
  growthPotential: string
  metrics: {
    payoutRatio: { value: number; status: string; comment: string }
    fcfCoverage: { value: number; status: string; comment: string }
    debtLevel: { value: number; status: string; comment: string }
    consistency: { years: number; trend: string; comment: string }
  }
  projection: { nextYearEstimate: number; yieldOnCost5yr: number; scenario: string }
  risks: string[]
  summary: string
}

interface Props {
  readonly ticker: string
  readonly name: string
  readonly currentPrice: number
  readonly dividendYield?: number | null
  readonly eps?: number | null
  readonly sector?: string
}

export function USDividendSustainabilityCard({ ticker, name, currentPrice, dividendYield, eps, sector }: Props) {
  const [data, setData] = useState<SustainabilityData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const analyze = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/dividends/sustainability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker, name, currentPrice, dividendYield, eps, sector }),
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

  if (!dividendYield || dividendYield <= 0) return null

  const gradeColor = (g: string) => {
    if (g.startsWith("A")) return "text-emerald-400 bg-emerald-500/10"
    if (g.startsWith("B")) return "text-blue-400 bg-blue-500/10"
    if (g.startsWith("C")) return "text-amber-400 bg-amber-500/10"
    return "text-red-400 bg-red-500/10"
  }

  const statusColor = (s: string) => {
    if (s === "양호") return "text-emerald-400"
    if (s === "주의") return "text-amber-400"
    return "text-red-400"
  }

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-card)] p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BadgeDollarSign className="h-4 w-4 text-green-400" />
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">배당 지속가능성</h3>
        </div>
        {!data && (
          <button
            onClick={analyze}
            disabled={loading}
            className="rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-400 transition-colors hover:bg-green-500/20 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "분석하기"}
          </button>
        )}
      </div>

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      {data && (
        <div className="mt-3 space-y-3">
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-14">
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                <circle cx="18" cy="18" r="16" fill="none" stroke="var(--color-border)" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="16" fill="none"
                  stroke={data.sustainabilityScore >= 70 ? "#34d399" : data.sustainabilityScore >= 40 ? "#fbbf24" : "#f87171"}
                  strokeWidth="3" strokeLinecap="round"
                  strokeDasharray={`${data.sustainabilityScore} ${100 - data.sustainabilityScore}`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-[var(--color-text-primary)]">
                {data.sustainabilityScore}
              </div>
            </div>
            <div>
              <span className={`rounded-full px-2.5 py-1 text-sm font-bold ${gradeColor(data.grade)}`}>{data.grade}</span>
              <div className="mt-1 text-[11px] text-[var(--color-text-secondary)]">
                안전도: {data.dividendSafety} · 성장: {data.growthPotential}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "배당성향", val: `${data.metrics.payoutRatio.value}%`, status: data.metrics.payoutRatio.status },
              { label: "FCF 커버리지", val: `${data.metrics.fcfCoverage.value}x`, status: data.metrics.fcfCoverage.status },
              { label: "부채수준", val: `${data.metrics.debtLevel.value}%`, status: data.metrics.debtLevel.status },
              { label: "연속배당", val: `${data.metrics.consistency.years}년 ${data.metrics.consistency.trend}`, status: data.metrics.consistency.trend === "증가" ? "양호" : data.metrics.consistency.trend === "유지" ? "주의" : "위험" },
            ].map((m, i) => (
              <div key={i} className="rounded-lg bg-[var(--color-surface-elevated)] p-2">
                <div className="text-[9px] text-[var(--color-text-tertiary)]">{m.label}</div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-xs font-semibold text-[var(--color-text-primary)]">{m.val}</span>
                  <span className={`text-[9px] font-medium ${statusColor(m.status)}`}>{m.status}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-green-500/5 border border-green-500/20 p-2.5">
            <TrendingUp className="h-3.5 w-3.5 text-green-400" />
            <div className="text-[11px]">
              <span className="text-[var(--color-text-secondary)]">예상 배당: </span>
              <span className="font-medium text-[var(--color-text-primary)]">{formatUSD(data.projection.nextYearEstimate)}</span>
              <span className="text-[var(--color-text-tertiary)]"> · 5년 YoC {data.projection.yieldOnCost5yr}%</span>
            </div>
          </div>

          {data.risks.length > 0 && (
            <div className="text-[11px]">
              {data.risks.map((r, i) => (
                <div key={i} className="text-[var(--color-text-tertiary)]">
                  <Shield className="inline h-3 w-3 text-amber-400 mr-1" />{r}
                </div>
              ))}
            </div>
          )}

          <p className="text-[10px] text-[var(--color-text-tertiary)]">{data.summary}</p>
        </div>
      )}
    </div>
  )
}
