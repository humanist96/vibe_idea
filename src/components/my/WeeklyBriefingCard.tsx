"use client"

import { useState } from "react"
import { Newspaper, Loader2, Star, AlertTriangle, CheckCircle, Quote } from "lucide-react"
import type { PortfolioItem } from "@/store/portfolio"
import type { QuoteResult } from "@/app/api/user/portfolio/quotes/route"

interface WeeklyData {
  weekTitle: string
  marketReview: {
    sentiment: string
    highlights: string[]
    summary: string
  }
  portfolioReview: {
    totalReturn: string
    bestPick: { name: string; reason: string }
    worstPick: { name: string; reason: string }
    grade: string
  }
  nextWeekOutlook: {
    events: string[]
    watchList: string[]
    strategy: string
  }
  actionItems: Array<{ priority: string; action: string }>
  quote: string
}

interface Props {
  items: readonly PortfolioItem[]
  quotes: Record<string, QuoteResult>
}

export function WeeklyBriefingCard({ items, quotes }: Props) {
  const [data, setData] = useState<WeeklyData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const generate = async () => {
    setLoading(true)
    setError("")
    try {
      const portfolio = items.map((item) => {
        const q = quotes[item.ticker]
        return {
          ticker: item.ticker,
          name: item.ticker,
          changePercent: q?.changePercent ?? 0,
          currentPrice: q?.price ?? item.avgPrice,
        }
      })

      const res = await fetch("/api/reports/weekly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portfolio }),
      })
      const json = await res.json()
      if (json.success) setData(json.data)
      else setError(json.error || "생성 실패")
    } catch {
      setError("네트워크 오류")
    } finally {
      setLoading(false)
    }
  }

  const sentimentColor = (s: string) => {
    if (s === "강세") return "text-emerald-400"
    if (s === "약세") return "text-red-400"
    return "text-amber-400"
  }

  const gradeColor = (g: string) => {
    if (g === "A") return "text-emerald-400 bg-emerald-500/10"
    if (g === "B") return "text-blue-400 bg-blue-500/10"
    if (g === "C") return "text-amber-400 bg-amber-500/10"
    return "text-red-400 bg-red-500/10"
  }

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-card)] p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">주간 AI 브리핑</h3>
        </div>
        {!data && (
          <button
            onClick={generate}
            disabled={loading}
            className="rounded-lg bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-400 transition-colors hover:bg-indigo-500/20 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "브리핑 생성"}
          </button>
        )}
      </div>

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      {data && (
        <div className="mt-3 space-y-3">
          <h4 className="text-sm font-bold text-[var(--color-text-primary)]">{data.weekTitle}</h4>

          {/* Market review */}
          <div className="rounded-lg bg-[var(--color-surface-elevated)] p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-medium text-[var(--color-text-tertiary)]">시장 리뷰</span>
              <span className={`text-xs font-bold ${sentimentColor(data.marketReview.sentiment)}`}>
                {data.marketReview.sentiment}
              </span>
            </div>
            <div className="space-y-0.5">
              {data.marketReview.highlights.map((h, i) => (
                <div key={i} className="text-[11px] text-[var(--color-text-secondary)]">• {h}</div>
              ))}
            </div>
          </div>

          {/* Portfolio review */}
          {items.length > 0 && (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-[var(--color-surface-elevated)] p-2">
                <div className="text-[9px] text-[var(--color-text-tertiary)]">주간 수익률</div>
                <div className="text-sm font-bold text-[var(--color-text-primary)]">{data.portfolioReview.totalReturn}</div>
              </div>
              <div className="rounded-lg bg-[var(--color-surface-elevated)] p-2">
                <div className="text-[9px] text-[var(--color-text-tertiary)]">성적</div>
                <div className={`text-sm font-bold rounded-full ${gradeColor(data.portfolioReview.grade)}`}>{data.portfolioReview.grade}</div>
              </div>
              <div className="rounded-lg bg-[var(--color-surface-elevated)] p-2">
                <div className="text-[9px] text-[var(--color-text-tertiary)]">Best</div>
                <div className="text-[11px] font-medium text-emerald-400">{data.portfolioReview.bestPick.name}</div>
              </div>
            </div>
          )}

          {/* Next week outlook */}
          <div>
            <div className="mb-1 text-[10px] font-medium text-[var(--color-text-tertiary)]">다음 주 주목</div>
            <div className="flex flex-wrap gap-1">
              {data.nextWeekOutlook.watchList.map((w, i) => (
                <span key={i} className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] text-indigo-400">
                  {w}
                </span>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-[var(--color-text-secondary)]">{data.nextWeekOutlook.strategy}</p>
          </div>

          {/* Action items */}
          {data.actionItems.length > 0 && (
            <div className="space-y-1">
              {data.actionItems.map((a, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[11px]">
                  {a.priority === "높음" ? (
                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-400" />
                  ) : (
                    <CheckCircle className="mt-0.5 h-3 w-3 shrink-0 text-[var(--color-text-tertiary)]" />
                  )}
                  <span className="text-[var(--color-text-secondary)]">{a.action}</span>
                </div>
              ))}
            </div>
          )}

          {/* Quote */}
          <div className="flex items-start gap-2 rounded-lg bg-indigo-500/5 border border-indigo-500/20 p-2.5">
            <Quote className="h-3 w-3 shrink-0 text-indigo-400 mt-0.5" />
            <p className="text-[11px] italic text-[var(--color-text-secondary)]">{data.quote}</p>
          </div>
        </div>
      )}
    </div>
  )
}
