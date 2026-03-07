"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useWatchlistStore } from "@/store/watchlist"
import { usePortfolioStore } from "@/store/portfolio"
import { formatPercent } from "@/lib/utils/format"
import { Star } from "lucide-react"

interface WatchPrice {
  readonly ticker: string
  readonly name: string
  readonly changePercent: number
}

export function WatchlistTodayCard() {
  const tickers = useWatchlistStore((s) => s.tickers)
  const portfolioItems = usePortfolioStore((s) => s.items)
  const [prices, setPrices] = useState<WatchPrice[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const nonPortfolioTickers = tickers.filter(
    (t) => !portfolioItems.some((p) => p.ticker === t)
  )

  useEffect(() => {
    if (nonPortfolioTickers.length === 0) return

    async function fetchPrices() {
      setIsLoading(true)
      try {
        const results = await Promise.allSettled(
          nonPortfolioTickers.slice(0, 5).map(async (ticker) => {
            const res = await fetch(`/api/stocks/${ticker}`)
            if (!res.ok) return null
            const data = await res.json()
            return {
              ticker,
              name: data.name || ticker,
              changePercent: data.changePercent ?? 0,
            } as WatchPrice
          })
        )
        const valid = results
          .filter((r): r is PromiseFulfilledResult<WatchPrice | null> => r.status === "fulfilled")
          .map((r) => r.value)
          .filter((v): v is WatchPrice => v !== null)
        setPrices(valid)
      } catch {
        // silently fail
      } finally {
        setIsLoading(false)
      }
    }

    fetchPrices()
  }, [nonPortfolioTickers.join(",")])

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-card)] p-6">
      <div className="mb-3 flex items-center gap-2">
        <Star className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-bold text-[var(--color-text-primary)]">관심종목 오늘</h3>
      </div>

      {nonPortfolioTickers.length === 0 ? (
        <p className="text-xs text-[var(--color-text-muted)]">
          포트폴리오에 없는 관심종목이 없습니다.
        </p>
      ) : isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-6 animate-pulse rounded bg-[var(--color-surface-100)]" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {prices.map((p) => (
            <Link
              key={p.ticker}
              href={`/stock/${p.ticker}`}
              className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-[var(--color-surface-50)] transition-colors"
            >
              <div>
                <span className="text-sm text-[var(--color-text-primary)]">{p.name}</span>
                <span className="ml-1.5 text-xs text-[var(--color-text-muted)]">{p.ticker}</span>
              </div>
              <span
                className={`text-xs font-medium ${
                  p.changePercent > 0
                    ? "text-red-500"
                    : p.changePercent < 0
                    ? "text-blue-500"
                    : "text-[var(--color-text-muted)]"
                }`}
              >
                {formatPercent(p.changePercent)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
