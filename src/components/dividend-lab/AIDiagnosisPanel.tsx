"use client"

import { useState, useCallback } from "react"
import { Sparkles, ArrowUp, ArrowDown, Plus, Minus } from "lucide-react"
import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { useDividendPortfolioStore } from "@/store/dividend-portfolio"
import type { DividendDiagnosis, DividendSimulation } from "@/lib/dividend/dividend-types"
import { GRADE_COLORS, MARKET_BADGE_STYLES } from "./constants"

interface AIDiagnosisPanelProps {
  readonly simulation: DividendSimulation
}

const ACTION_CONFIG = {
  add: { icon: Plus, label: "추가", color: "text-emerald-400" },
  remove: { icon: Minus, label: "제거", color: "text-red-400" },
  increase: { icon: ArrowUp, label: "비중↑", color: "text-blue-400" },
  decrease: { icon: ArrowDown, label: "비중↓", color: "text-amber-400" },
} as const

export function AIDiagnosisPanel({ simulation }: AIDiagnosisPanelProps) {
  const { settings, items } = useDividendPortfolioStore()
  const [diagnosis, setDiagnosis] = useState<DividendDiagnosis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runDiagnosis = useCallback(async () => {
    if (items.length === 0) return
    setLoading(true)
    setError(null)
    try {
      const diagnosisItems = items.map((item) => ({
        ticker: item.ticker,
        market: item.market,
        name: item.nameKr || item.name,
        weight: item.weight,
        dividendYield: simulation.summary.weightedYield,
        sector: item.sectorKr,
        paymentMonths: simulation.monthlySchedule
          .filter((m) => m.stocks.some((s) => s.ticker === item.ticker))
          .map((m) => m.month),
      }))

      const res = await fetch("/api/dividend-lab/diagnosis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: diagnosisItems,
          settings: {
            totalAmount: settings.totalAmount,
            period: settings.period,
            drip: settings.drip,
          },
        }),
      })
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`)
      }
      const json = await res.json()
      if (json.success) {
        setDiagnosis(json.data)
      } else {
        throw new Error(json.error ?? "진단 실패")
      }
    } catch {
      setError("AI 진단에 실패했습니다. 다시 시도해주세요.")
    } finally {
      setLoading(false)
    }
  }, [items, settings, simulation])

  if (!diagnosis && !loading) {
    return (
      <Card className="animate-fade-up stagger-6">
        <div className="flex flex-col items-center py-8">
          <Sparkles className="mb-3 h-8 w-8 text-purple-400/60" />
          <p className="mb-4 text-sm text-[var(--color-text-muted)]">
            AI가 포트폴리오를 분석하고 개선 방안을 제시합니다
          </p>
          {error && (
            <p className="mb-3 text-xs text-red-400">{error}</p>
          )}
          <button
            type="button"
            onClick={runDiagnosis}
            className="rounded-lg bg-purple-500/10 px-6 py-2.5 text-sm font-medium text-purple-400 ring-1 ring-purple-500/30 hover:bg-purple-500/20 transition-all"
          >
            AI 포트폴리오 진단
          </button>
        </div>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="animate-fade-up stagger-6">
        <CardHeader>
          <CardTitle>AI 포트폴리오 진단</CardTitle>
        </CardHeader>
        <div className="space-y-3">
          <LoadingSkeleton className="h-6 w-32" />
          <LoadingSkeleton className="h-16 w-full" />
          <div className="grid grid-cols-2 gap-3">
            <LoadingSkeleton className="h-24 w-full" />
            <LoadingSkeleton className="h-24 w-full" />
          </div>
          <LoadingSkeleton className="h-20 w-full" />
        </div>
      </Card>
    )
  }

  if (!diagnosis) return null

  return (
    <Card className="animate-fade-up stagger-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>AI 포트폴리오 진단</CardTitle>
          <button
            type="button"
            onClick={runDiagnosis}
            className="rounded-md bg-[var(--color-glass-2)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-tertiary)] ring-1 ring-[var(--color-border-subtle)] hover:text-[var(--color-text-secondary)] transition-all"
          >
            다시 진단
          </button>
        </div>
      </CardHeader>

      <div className="space-y-5">
        {/* Overall Grade + Summary */}
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
              종합 등급
            </span>
            <span
              className={`mt-1 text-3xl font-bold ${GRADE_COLORS[diagnosis.overallGrade] ?? "text-[var(--color-text-primary)]"}`}
            >
              {diagnosis.overallGrade}
            </span>
          </div>
          <p className="flex-1 rounded-lg bg-[var(--color-glass-1)] px-4 py-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {diagnosis.summary}
          </p>
        </div>

        {/* Strengths & Risks */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {diagnosis.strengths.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-semibold text-emerald-400">강점</h4>
              <ul className="space-y-1.5">
                {diagnosis.strengths.map((s) => (
                  <li
                    key={s}
                    className="rounded-md bg-emerald-500/5 px-3 py-2 text-xs text-emerald-300"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {diagnosis.risks.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-semibold text-red-400">리스크</h4>
              <ul className="space-y-1.5">
                {diagnosis.risks.map((r) => (
                  <li
                    key={r}
                    className="rounded-md bg-red-500/5 px-3 py-2 text-xs text-red-300"
                  >
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Rebalancing Suggestions */}
        {diagnosis.rebalancingSuggestions.length > 0 && (
          <div>
            <h4 className="mb-2 text-xs font-semibold text-blue-400">리밸런싱 제안</h4>
            <div className="space-y-2">
              {diagnosis.rebalancingSuggestions.map((sug) => {
                const config = ACTION_CONFIG[sug.action]
                const Icon = config.icon
                return (
                  <div
                    key={`${sug.action}-${sug.ticker}`}
                    className="flex items-start gap-3 rounded-lg bg-[var(--color-glass-1)] px-3 py-2.5 ring-1 ring-[var(--color-border-subtle)]"
                  >
                    <div className={`mt-0.5 flex items-center gap-1.5 ${config.color}`}>
                      <Icon className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-bold uppercase">{config.label}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={
                            "rounded px-1.5 py-0.5 text-[10px] font-bold " +
                            MARKET_BADGE_STYLES[sug.market]
                          }
                        >
                          {sug.market}
                        </span>
                        <span className="text-sm font-medium text-[var(--color-text-primary)]">
                          {sug.ticker}
                        </span>
                        {sug.suggestedWeight != null && (
                          <span className="text-[10px] tabular-nums text-[var(--color-text-muted)]">
                            → {sug.suggestedWeight}%
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
                        {sug.reason}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Gap Month Suggestions */}
        {diagnosis.gapMonthSuggestions.length > 0 && (
          <div>
            <h4 className="mb-2 text-xs font-semibold text-amber-400">공백월 해소 추천</h4>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {diagnosis.gapMonthSuggestions.map((sug) => (
                <div
                  key={`gap-${sug.ticker}`}
                  className="rounded-lg bg-amber-500/5 px-3 py-2.5 ring-1 ring-amber-500/10"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        "rounded px-1.5 py-0.5 text-[10px] font-bold " +
                        MARKET_BADGE_STYLES[sug.market]
                      }
                    >
                      {sug.market}
                    </span>
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">
                      {sug.name}
                    </span>
                    <span className="text-[10px] text-[var(--color-text-muted)]">
                      {sug.ticker}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-amber-300/80">{sug.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
