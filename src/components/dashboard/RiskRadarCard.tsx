"use client"

import { useState, useCallback } from "react"
import { Card } from "@/components/ui/Card"
import { Shield, Loader2, RefreshCw, AlertTriangle, Zap } from "lucide-react"
import { cn } from "@/lib/utils/cn"

interface RiskDimension {
  readonly score: number
  readonly label: string
  readonly comment: string
}

interface TopRisk {
  readonly title: string
  readonly description: string
  readonly severity: "high" | "medium" | "low"
}

interface RiskData {
  readonly overallRisk: number
  readonly riskGrade: string
  readonly dimensions: Record<string, RiskDimension>
  readonly topRisks: readonly TopRisk[]
  readonly opportunities: readonly string[]
  readonly actionItems: readonly string[]
  readonly summary: string
}

const GRADE_COLORS: Record<string, string> = {
  "안전": "text-emerald-600 bg-emerald-50",
  "주의": "text-amber-600 bg-amber-50",
  "경계": "text-orange-600 bg-orange-50",
  "위험": "text-red-600 bg-red-50",
  "심각": "text-red-800 bg-red-100",
}

function RiskBar({ label, score }: { readonly label: string; readonly score: number }) {
  const color = score >= 70 ? "bg-red-500" : score >= 40 ? "bg-amber-500" : "bg-emerald-500"
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-[var(--color-text-tertiary)]">{label}</span>
        <span className="font-semibold tabular-nums text-[var(--color-text-secondary)]">{score}</span>
      </div>
      <div className="h-1 rounded-full bg-slate-100">
        <div className={cn("h-full rounded-full transition-all duration-500", color)} style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}

export function RiskRadarCard() {
  const [data, setData] = useState<RiskData | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchRisk = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/risk-radar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      const json = await res.json()
      if (json.success) setData(json.data)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <Card>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-orange-500" />
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">리스크 레이더</h3>
          </div>
          <button
            type="button"
            onClick={fetchRisk}
            disabled={loading}
            className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-slate-100 transition-colors disabled:opacity-40"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </button>
        </div>

        {loading && !data && (
          <div className="flex items-center justify-center gap-2 py-6 text-xs text-[var(--color-text-muted)]">
            <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
            리스크 분석 중...
          </div>
        )}

        {!data && !loading && (
          <button
            type="button"
            onClick={fetchRisk}
            className="w-full rounded-lg bg-gradient-to-r from-orange-50 to-red-50 px-4 py-6 text-xs font-medium text-orange-700 ring-1 ring-orange-200/40 hover:from-orange-100 hover:to-red-100 transition-colors"
          >
            <Shield className="mx-auto mb-2 h-6 w-6 text-orange-400" />
            AI 리스크 레이더 분석 시작
          </button>
        )}

        {data && (
          <>
            {/* Grade */}
            <div className="flex items-center gap-2">
              <span className={cn("rounded-md px-2 py-0.5 text-xs font-bold", GRADE_COLORS[data.riskGrade] ?? "bg-slate-50 text-slate-600")}>
                {data.riskGrade}
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">종합 리스크 {data.overallRisk}/100</span>
            </div>

            {/* Summary */}
            <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">{data.summary}</p>

            {/* Dimensions */}
            <div className="space-y-2">
              {Object.values(data.dimensions).map((dim) => (
                <RiskBar key={dim.label} label={dim.label} score={dim.score} />
              ))}
            </div>

            {/* Top Risks */}
            {data.topRisks.length > 0 && (
              <div className="space-y-1">
                {data.topRisks.slice(0, 3).map((risk, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <AlertTriangle className={cn(
                      "mt-0.5 h-3 w-3 shrink-0",
                      risk.severity === "high" ? "text-red-500" : risk.severity === "medium" ? "text-amber-500" : "text-slate-400"
                    )} />
                    <span className="text-[var(--color-text-tertiary)]">
                      <strong className="text-[var(--color-text-secondary)]">{risk.title}</strong> — {risk.description}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Opportunities */}
            {data.opportunities.length > 0 && (
              <div className="space-y-1">
                {data.opportunities.slice(0, 2).map((opp, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <Zap className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
                    <span className="text-emerald-700">{opp}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  )
}
