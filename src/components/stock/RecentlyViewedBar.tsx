"use client"

import Link from "next/link"
import { Clock } from "lucide-react"
import { useRecentlyViewedStore } from "@/store/recently-viewed"
import { cn } from "@/lib/utils/cn"

interface RecentlyViewedBarProps {
  readonly currentTicker: string
}

export function RecentlyViewedBar({ currentTicker }: RecentlyViewedBarProps) {
  const stocks = useRecentlyViewedStore((s) => s.stocks)

  const recentStocks = stocks.filter((s) => s.ticker !== currentTicker).slice(0, 8)

  if (recentStocks.length === 0) return null

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 animate-fade-up">
      <Clock size={12} className="shrink-0 text-[var(--color-text-muted)]" />
      <div className="flex gap-1.5">
        {recentStocks.map((stock) => (
          <Link
            key={stock.ticker}
            href={`/stock/${stock.ticker}`}
            className={cn(
              "inline-flex shrink-0 items-center rounded-full border border-[var(--color-border-default)] px-2.5 py-1 text-xs font-medium transition-colors",
              "text-[var(--color-text-secondary)] hover:border-[var(--color-accent-400)] hover:text-[var(--color-accent-500)]"
            )}
          >
            {stock.name}
          </Link>
        ))}
      </div>
    </div>
  )
}
