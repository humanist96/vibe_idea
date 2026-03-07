"use client"

import { useState, useCallback } from "react"
import { Card } from "@/components/ui/Card"
import { FlaskConical, Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import type { PortfolioItem } from "@/store/portfolio"
import type { QuoteResult } from "@/app/api/user/portfolio/quotes/route"

interface StockImpact {
  readonly name: string
  readonly ticker: string
  readonly impact: "수혜" | "피해" | "중립"
  readonly estimatedChange: number
  readonly reason: string
}

interface ScenarioResult {
  readonly scenario: string
  readonly probability: string
  readonly overallImpact: string
  readonly portfolioImpact: { readonly estimatedChange: number; readonly comment: string }
  readonly sectorImpacts: readonly { readonly sector: string; readonly impact: string; readonly reason: string }[]
  readonly stockImpacts: readonly StockImpact[]
  readonly hedgingStrategies: readonly string[]
  readonly historicalReference: string
  readonly summary: string
}

const EXAMPLE_SCENARIOS = [
  "한미 금리 동결 장기화",
  "환율 1,400원 돌파",
  "유가 20% 급등",
  "AI 반도체 수요 급증",
]

interface ScenarioSimulatorCardProps {
  readonly items: readonly PortfolioItem[]
  readonly quotes: Record<string, QuoteResult>
}

export function ScenarioSimulatorCard({ items, quotes }: ScenarioSimulatorCardProps) {
  const [scenario, setScenario] = useState("")
  const [result, setResult] = useState<ScenarioResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const simulate = useCallback(async (input: string) => {
    const trimmed = input.trim()
    if (!trimmed) return
    setLoading(true)
    setError("")
    setResult(null)

    try {
      const portfolio = items.map((item) => {
        const quote = quotes[item.ticker]
        const currentValue = item.quantity * (quote?.price ?? item.avgPrice)
        const totalValue = items.reduce((sum, i) => {
          const q = quotes[i.ticker]
          return sum + i.quantity * (q?.price ?? i.avgPrice)
        }, 0)
        return {
          name: item.name,
          ticker: item.ticker,
          sector: item.sectorKr,
          market: item.market,
          weight: totalValue > 0 ? (currentValue / totalValue) * 100 : 0,
          currentValue,
        }
      })

      const res = await fetch("/api/scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: trimmed, portfolio: portfolio.length > 0 ? portfolio : undefined }),
      })
      const json = await res.json()

      if (json.success) {
        setResult(json.data)
      } else {
        setError(json.error ?? "시뮬레이션에 실패했습니다.")
      }
    } catch {
      setError("요청 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }, [items, quotes])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    simulate(scenario)
  }

  return (
    <Card>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 shadow-sm">
            <FlaskConical className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">AI 시나리오 시뮬레이터</h3>
            <p className="text-[10px] text-[var(--color-text-muted)]">What-If 분석으로 포트폴리오 영향 예측</p>
          </div>
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            placeholder="시나리오 입력: &quot;금리 0.5% 인상&quot;, &quot;유가 급등&quot; ..."
            disabled={loading}
            className={
              "flex-1 rounded-lg px-3 py-2 text-sm outline-none transition-all " +
              "bg-[var(--color-glass-2)] text-[var(--color-text-primary)] " +
              "ring-1 ring-[var(--color-border-subtle)] " +
              "placeholder:text-[var(--color-text-muted)] " +
              "focus:ring-cyan-400/40 disabled:opacity-50"
            }
          />
          <button
            type="submit"
            disabled={loading || !scenario.trim()}
            className={cn(
              "flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold transition-all",
              "bg-gradient-to-r from-cyan-500 to-teal-600 text-white shadow-sm",
              "hover:from-cyan-600 hover:to-teal-700",
              "disabled:opacity-40 disabled:cursor-not-allowed"
            )}
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FlaskConical className="h-3.5 w-3.5" />}
            시뮬레이션
          </button>
        </form>

        {/* Example scenarios */}
        {!result && !loading && (
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLE_SCENARIOS.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => { setScenario(ex); simulate(ex) }}
                className="rounded-full px-2.5 py-1 text-[11px] font-medium bg-[var(--color-glass-2)] text-[var(--color-text-tertiary)] ring-1 ring-[var(--color-border-subtle)] hover:bg-cyan-50 hover:text-cyan-700 hover:ring-cyan-200 transition-all"
              >
                {ex}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 ring-1 ring-red-200/60">{error}</div>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-2 py-6 text-xs text-[var(--color-text-muted)]">
            <Loader2 className="h-4 w-4 animate-spin text-cyan-500" />
            시나리오 시뮬레이션 중...
          </div>
        )}

        {result && !loading && (
          <div className="space-y-3">
            {/* Overall Impact */}
            <div className="flex items-center gap-3 rounded-lg bg-slate-50/80 p-3">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold",
                result.portfolioImpact.estimatedChange >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
              )}>
                {result.portfolioImpact.estimatedChange >= 0 ? "+" : ""}{result.portfolioImpact.estimatedChange}%
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className={cn(
                    "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                    result.overallImpact.includes("긍정") ? "bg-emerald-100 text-emerald-700" :
                    result.overallImpact.includes("부정") ? "bg-red-100 text-red-700" :
                    "bg-slate-100 text-slate-600"
                  )}>
                    {result.overallImpact}
                  </span>
                  <span className="text-[var(--color-text-muted)]">발생확률: {result.probability}</span>
                </div>
                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{result.portfolioImpact.comment}</p>
              </div>
            </div>

            {/* Stock Impacts */}
            {result.stockImpacts.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
                  종목별 영향
                </p>
                {result.stockImpacts.slice(0, 5).map((stock) => (
                  <div key={stock.ticker} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2">
                      {stock.impact === "수혜" ? <TrendingUp className="h-3 w-3 text-emerald-500" /> :
                       stock.impact === "피해" ? <TrendingDown className="h-3 w-3 text-red-500" /> :
                       <Minus className="h-3 w-3 text-slate-400" />}
                      <span className="font-medium text-[var(--color-text-primary)]">{stock.name}</span>
                    </div>
                    <span className={cn(
                      "font-bold tabular-nums",
                      stock.estimatedChange >= 0 ? "text-emerald-600" : "text-red-600"
                    )}>
                      {stock.estimatedChange >= 0 ? "+" : ""}{stock.estimatedChange}%
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Historical + Summary */}
            <p className="text-[11px] italic text-[var(--color-text-muted)]">{result.historicalReference}</p>
            <p className="text-[10px] text-[var(--color-text-muted)]">* 시뮬레이션 결과는 참고용이며 실제 결과와 다를 수 있습니다.</p>
          </div>
        )}
      </div>
    </Card>
  )
}
