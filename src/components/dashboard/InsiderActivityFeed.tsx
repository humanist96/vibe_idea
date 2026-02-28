"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { UserCheck, ArrowRight } from "lucide-react"
import { useWatchlistStore } from "@/store/watchlist"
import type { InsiderActivity } from "@/lib/api/dart-insider-types"

interface TickerActivity {
  readonly ticker: string
  readonly activity: InsiderActivity
}

export function InsiderActivityFeed() {
  const tickers = useWatchlistStore((s) => s.tickers)
  const [items, setItems] = useState<TickerActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (tickers.length === 0) {
      setLoading(false)
      return
    }

    async function fetchFeed() {
      try {
        const res = await fetch("/api/insider/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tickers }),
        })
        const json = await res.json()
        if (!json.success) return

        const all: TickerActivity[] = []
        for (const [ticker, activities] of Object.entries(json.data)) {
          for (const activity of activities as InsiderActivity[]) {
            all.push({ ticker, activity })
          }
        }

        const sorted = all
          .sort((a, b) => b.activity.date.localeCompare(a.activity.date))
          .slice(0, 5)

        setItems(sorted)
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchFeed()
  }, [tickers])

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <UserCheck className="h-3.5 w-3.5 text-[var(--color-accent-500)]" />
            최근 내부자 거래
          </span>
        </CardTitle>
      </CardHeader>

      {loading ? (
        <div className="space-y-3">
          <LoadingSkeleton className="h-10 w-full" />
          <LoadingSkeleton className="h-10 w-full" />
          <LoadingSkeleton className="h-10 w-full" />
        </div>
      ) : tickers.length === 0 ? (
        <p className="py-6 text-center text-xs text-[var(--color-text-tertiary)]">
          관심종목을 추가하면 내부자 거래를 확인할 수 있습니다
        </p>
      ) : items.length === 0 ? (
        <p className="py-6 text-center text-xs text-[var(--color-text-tertiary)]">
          최근 내부자 거래 내역이 없습니다
        </p>
      ) : (
        <div className="space-y-1">
          {items.map((item) => (
            <Link
              key={`${item.ticker}-${item.activity.id}`}
              href={`/stock/${item.ticker}`}
              className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-[var(--color-surface-50)]"
            >
              <Badge
                variant={item.activity.type === "buy" ? "green" : item.activity.type === "sell" ? "red" : "gray"}
              >
                {item.activity.type === "buy" ? "매수" : item.activity.type === "sell" ? "매도" : "기타"}
              </Badge>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                  {item.activity.name}
                </p>
                <p className="text-[10px] text-[var(--color-text-tertiary)]">
                  {item.ticker} · {item.activity.date}
                </p>
              </div>
              <span
                className={`shrink-0 text-xs font-medium tabular-nums ${
                  item.activity.type === "buy"
                    ? "text-[var(--color-gain)]"
                    : item.activity.type === "sell"
                      ? "text-[var(--color-loss)]"
                      : "text-[var(--color-text-secondary)]"
                }`}
              >
                {item.activity.shares > 0 ? "+" : ""}
                {Math.abs(item.activity.shares).toLocaleString("ko-KR")}주
              </span>
            </Link>
          ))}

          <div className="pt-2">
            <Link
              href="/watchlist"
              className="flex items-center justify-center gap-1 text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-accent-500)]"
            >
              관심종목 보기
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}
    </Card>
  )
}
