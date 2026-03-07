"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Eye, Plus } from "lucide-react"
import { useWatchlistStore } from "@/store/watchlist"
import { cn } from "@/lib/utils/cn"

interface QuickQuote {
  readonly ticker: string
  readonly name: string
  readonly price: number
  readonly changePercent: number
}

export function WatchlistQuickView() {
  const tickers = useWatchlistStore((s) => s.tickers)
  const [quotes, setQuotes] = useState<QuickQuote[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (tickers.length === 0) {
      setLoading(false)
      return
    }

    async function fetchQuotes() {
      try {
        const results = await Promise.all(
          tickers.slice(0, 5).map(async (ticker) => {
            try {
              const res = await fetch(`/api/stocks/${ticker}`)
              const json = await res.json()
              if (json.success) {
                return {
                  ticker,
                  name: json.data.name,
                  price: json.data.price,
                  changePercent: json.data.changePercent,
                } as QuickQuote
              }
              return null
            } catch {
              return null
            }
          })
        )
        setQuotes(results.filter((q): q is QuickQuote => q !== null))
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchQuotes()
  }, [tickers])

  if (loading) {
    return (
      <div className="glass-card p-5 animate-fade-up">
        <div className="skeleton-shimmer h-24 rounded-lg" />
      </div>
    )
  }

  if (tickers.length === 0) {
    return (
      <div className="glass-card p-5 animate-fade-up">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-secondary)]">
            관심종목
          </h3>
        </div>
        <div className="flex flex-col items-center py-4 text-center">
          <Eye className="mb-2 h-8 w-8 text-[var(--color-text-muted)]" />
          <p className="text-xs text-[var(--color-text-tertiary)]">
            관심종목이 없습니다
          </p>
          <Link
            href="/screener"
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[var(--color-accent-500)] hover:underline"
          >
            <Plus size={12} />
            종목 추가하기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card p-5 animate-fade-up">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-secondary)]">
          관심종목
        </h3>
        <Link
          href="/watchlist"
          className="text-[10px] text-[var(--color-accent-500)] hover:underline"
        >
          전체보기
        </Link>
      </div>
      <div className="space-y-2">
        {quotes.map((q) => (
          <Link
            key={q.ticker}
            href={`/stock/${q.ticker}`}
            className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-[var(--color-surface-50)]"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                {q.name}
              </p>
              <p className="text-[10px] text-[var(--color-text-tertiary)]">{q.ticker}</p>
            </div>
            <div className="text-right">
              <p className="tabular-nums text-sm font-semibold text-[var(--color-text-primary)]">
                {q.price.toLocaleString("ko-KR")}
              </p>
              <p
                className={cn(
                  "tabular-nums text-xs font-medium",
                  q.changePercent > 0
                    ? "text-[var(--color-gain)]"
                    : q.changePercent < 0
                      ? "text-[var(--color-loss)]"
                      : "text-[var(--color-text-tertiary)]"
                )}
              >
                {q.changePercent > 0 ? "+" : ""}
                {q.changePercent.toFixed(2)}%
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
