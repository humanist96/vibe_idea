"use client"

import { useState, useCallback } from "react"
import { Lightbulb, Plus } from "lucide-react"
import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { useDividendPortfolioStore } from "@/store/dividend-portfolio"
import type { DividendRecommendation, DividendMarket } from "@/lib/dividend/dividend-types"
import { MARKET_BADGE_STYLES } from "./constants"

type RecommendStrategy =
  | "high-yield"
  | "growth"
  | "safety"
  | "aristocrat"
  | "monthly-income"
  | "balanced"

const STRATEGIES: readonly { readonly value: RecommendStrategy; readonly label: string }[] = [
  { value: "balanced", label: "밸런스" },
  { value: "high-yield", label: "고배당" },
  { value: "growth", label: "성장형" },
  { value: "safety", label: "안전형" },
  { value: "aristocrat", label: "귀족" },
  { value: "monthly-income", label: "월배당" },
]

interface AIRecommendPanelProps {
  readonly existingTickers: readonly string[]
}

export function AIRecommendPanel({ existingTickers }: AIRecommendPanelProps) {
  const { addItem } = useDividendPortfolioStore()
  const [strategy, setStrategy] = useState<RecommendStrategy>("balanced")
  const [markets, setMarkets] = useState<readonly DividendMarket[]>(["KR", "US"])
  const [recommendations, setRecommendations] = useState<readonly DividendRecommendation[]>([])
  const [strategySummary, setStrategySummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  const fetchRecommendations = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/dividend-lab/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strategy,
          existingTickers,
          markets,
          count: 5,
        }),
      })
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`)
      }
      const json = await res.json()
      if (json.success) {
        setRecommendations(json.data.recommendations ?? [])
        setStrategySummary(json.data.strategy_summary ?? null)
        setHasSearched(true)
      } else {
        throw new Error(json.error ?? "추천 실패")
      }
    } catch {
      setError("AI 추천에 실패했습니다. 다시 시도해주세요.")
    } finally {
      setLoading(false)
    }
  }, [strategy, existingTickers, markets])

  function toggleMarket(m: DividendMarket) {
    const current = [...markets]
    const idx = current.indexOf(m)
    if (idx >= 0 && current.length > 1) {
      setMarkets([...current.slice(0, idx), ...current.slice(idx + 1)])
    } else if (idx < 0) {
      setMarkets([...current, m])
    }
  }

  function handleAddToPortfolio(rec: DividendRecommendation) {
    addItem({
      ticker: rec.ticker,
      market: rec.market,
      weight: rec.suggestedWeight,
      name: rec.name,
      nameKr: rec.name,
      sectorKr: "",
    })
  }

  return (
    <Card className="animate-fade-up stagger-7">
      <CardHeader>
        <CardTitle>AI 종목 추천</CardTitle>
      </CardHeader>

      <div className="space-y-4">
        {/* Strategy selector */}
        <div>
          <span className="mb-1.5 block text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
            투자 전략
          </span>
          <div className="flex flex-wrap gap-1.5">
            {STRATEGIES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setStrategy(s.value)}
                className={
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-all " +
                  (strategy === s.value
                    ? "bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/30"
                    : "bg-[var(--color-glass-2)] text-[var(--color-text-tertiary)] ring-1 ring-[var(--color-border-subtle)] hover:text-[var(--color-text-secondary)]")
                }
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Market selector */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
            시장
          </span>
          {(["KR", "US"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => toggleMarket(m)}
              className={
                "rounded-md px-3 py-1.5 text-xs font-medium transition-all " +
                (markets.includes(m)
                  ? "bg-[var(--color-glass-3)] text-[var(--color-text-primary)] ring-1 ring-[var(--color-border-subtle)]"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]")
              }
            >
              {m === "KR" ? "국내" : "해외"}
            </button>
          ))}

          <button
            type="button"
            onClick={fetchRecommendations}
            disabled={loading}
            className="ml-auto rounded-lg bg-purple-500/10 px-5 py-2 text-sm font-medium text-purple-400 ring-1 ring-purple-500/30 hover:bg-purple-500/20 disabled:opacity-40 transition-all"
          >
            {loading ? "분석 중..." : "추천 받기"}
          </button>
        </div>

        {error && (
          <div className="rounded-md bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
            <button
              type="button"
              onClick={fetchRecommendations}
              className="ml-2 underline hover:text-red-300"
            >
              재시도
            </button>
          </div>
        )}

        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <LoadingSkeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        )}

        {/* Strategy summary */}
        {strategySummary && !loading && (
          <div className="flex items-start gap-2 rounded-lg bg-purple-500/5 px-4 py-3">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-purple-400" />
            <p className="text-xs leading-relaxed text-purple-300">{strategySummary}</p>
          </div>
        )}

        {/* Recommendations */}
        {!loading && recommendations.length > 0 && (
          <div className="space-y-2">
            {recommendations.map((rec) => (
              <div
                key={`${rec.market}:${rec.ticker}`}
                className="flex items-start gap-3 rounded-lg bg-[var(--color-glass-1)] px-3 py-3 ring-1 ring-[var(--color-border-subtle)]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        "rounded px-1.5 py-0.5 text-[10px] font-bold " +
                        MARKET_BADGE_STYLES[rec.market]
                      }
                    >
                      {rec.market}
                    </span>
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">
                      {rec.name}
                    </span>
                    <span className="text-[10px] text-[var(--color-text-muted)]">
                      {rec.ticker}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-[10px]">
                    <span className="tabular-nums text-amber-400">
                      배당 {rec.dividendYield.toFixed(1)}%
                    </span>
                    <span className="tabular-nums text-[var(--color-text-muted)]">
                      추천 비중 {rec.suggestedWeight}%
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">{rec.reason}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleAddToPortfolio(rec)}
                  aria-label={`${rec.name} 포트폴리오에 추가`}
                  className="shrink-0 rounded-md bg-blue-500/10 p-2 text-blue-400 hover:bg-blue-500/20 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {!loading && hasSearched && recommendations.length === 0 && (
          <div className="py-8 text-center text-sm text-[var(--color-text-muted)]">
            추천 결과가 없습니다. 다른 전략을 시도해보세요.
          </div>
        )}
      </div>
    </Card>
  )
}
