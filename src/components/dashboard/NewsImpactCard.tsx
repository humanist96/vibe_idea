"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/Card"
import { Newspaper, Loader2, TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { useWatchlistStore } from "@/store/watchlist"

interface NewsImpact {
  readonly ticker: string
  readonly name: string
  readonly headline: string
  readonly sentiment: "positive" | "negative" | "neutral"
  readonly impact: number
  readonly reason: string
  readonly category: string
}

interface NewsImpactData {
  readonly impacts: readonly NewsImpact[]
  readonly marketMood: string
  readonly summary: string
}

const STOCK_NAMES: Record<string, string> = {}

function SentimentIcon({ sentiment }: { readonly sentiment: string }) {
  if (sentiment === "positive") return <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
  if (sentiment === "negative") return <TrendingDown className="h-3.5 w-3.5 text-red-500" />
  return <Minus className="h-3.5 w-3.5 text-slate-400" />
}

function ImpactDots({ level }: { readonly level: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            i < level ? (
              level >= 4 ? "bg-red-400" : level >= 3 ? "bg-amber-400" : "bg-slate-300"
            ) : "bg-slate-100"
          )}
        />
      ))}
    </div>
  )
}

export function NewsImpactCard() {
  const tickers = useWatchlistStore((s) => s.tickers)
  const [data, setData] = useState<NewsImpactData | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchImpact = useCallback(async () => {
    if (tickers.length === 0) return

    setLoading(true)
    try {
      const tickerItems = tickers.slice(0, 8).map((t) => ({
        ticker: t,
        name: STOCK_NAMES[t] || t,
      }))

      const res = await fetch("/api/news/impact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tickers: tickerItems }),
      })
      const json = await res.json()
      if (json.success) {
        setData(json.data)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [tickers])

  useEffect(() => {
    fetchImpact()
  }, [fetchImpact])

  if (tickers.length === 0) return null

  return (
    <Card>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Newspaper className="h-4 w-4 text-blue-500" />
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">뉴스 임팩트</h3>
          </div>
          <button
            type="button"
            onClick={fetchImpact}
            disabled={loading}
            className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-slate-100 transition-colors disabled:opacity-40"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </button>
        </div>

        {loading && !data && (
          <div className="flex items-center justify-center gap-2 py-6 text-xs text-[var(--color-text-muted)]">
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            뉴스 분석 중...
          </div>
        )}

        {data && (
          <>
            {/* Market Mood */}
            <div className={cn(
              "rounded-lg px-3 py-2 text-xs font-medium",
              data.marketMood === "긍정적" ? "bg-emerald-50 text-emerald-700" :
              data.marketMood === "부정적" ? "bg-red-50 text-red-700" :
              "bg-slate-50 text-slate-600"
            )}>
              {data.summary}
            </div>

            {/* Impact list */}
            <div className="space-y-2">
              {data.impacts.slice(0, 5).map((item) => (
                <div key={item.ticker} className="flex items-start gap-2.5 rounded-lg p-2 hover:bg-slate-50/50 transition-colors">
                  <SentimentIcon sentiment={item.sentiment} />
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-[var(--color-text-primary)]">{item.name}</span>
                      <span className={cn(
                        "rounded px-1 py-0.5 text-[9px] font-medium",
                        item.sentiment === "positive" ? "bg-emerald-100 text-emerald-700" :
                        item.sentiment === "negative" ? "bg-red-100 text-red-700" :
                        "bg-slate-100 text-slate-500"
                      )}>
                        {item.category}
                      </span>
                      <ImpactDots level={item.impact} />
                    </div>
                    <p className="truncate text-[11px] text-[var(--color-text-tertiary)]">{item.headline}</p>
                    <p className="text-[10px] text-[var(--color-text-muted)]">{item.reason}</p>
                  </div>
                </div>
              ))}
            </div>

            {data.impacts.length === 0 && (
              <p className="py-4 text-center text-xs text-[var(--color-text-muted)]">
                관심종목 관련 주요 뉴스가 없습니다
              </p>
            )}
          </>
        )}
      </div>
    </Card>
  )
}
