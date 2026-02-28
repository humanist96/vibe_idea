"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { UserCheck } from "lucide-react"
import { useWatchlistStore } from "@/store/watchlist"
import type { InsiderActivity } from "@/lib/api/dart-insider-types"

interface TickerActivity {
  readonly ticker: string
  readonly activity: InsiderActivity
}

function formatShares(shares: number): string {
  const abs = Math.abs(shares)
  if (abs >= 100_000_000) return `${(abs / 100_000_000).toFixed(1)}억`
  if (abs >= 10_000) return `${(abs / 10_000).toFixed(1)}만`
  return abs.toLocaleString("ko-KR")
}

export default function InsiderPage() {
  const tickers = useWatchlistStore((s) => s.tickers)
  const [items, setItems] = useState<TickerActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (tickers.length === 0) {
      setLoading(false)
      return
    }

    async function fetchAll() {
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

        setItems(all.sort((a, b) => b.activity.date.localeCompare(a.activity.date)))
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [tickers])

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          내부자 거래
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
          관심종목의 최근 내부자 거래 현황
        </p>
      </div>

      <Card className="animate-fade-up stagger-2">
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <UserCheck className="h-3.5 w-3.5 text-[var(--color-accent-500)]" />
              전체 내부자 거래
            </span>
          </CardTitle>
        </CardHeader>

        {loading ? (
          <div className="space-y-3">
            <LoadingSkeleton className="h-10 w-full" />
            <LoadingSkeleton className="h-10 w-full" />
            <LoadingSkeleton className="h-10 w-full" />
            <LoadingSkeleton className="h-10 w-full" />
            <LoadingSkeleton className="h-10 w-full" />
          </div>
        ) : tickers.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-[var(--color-text-tertiary)]">
              관심종목을 추가하면 내부자 거래를 확인할 수 있습니다
            </p>
            <Link
              href="/screener"
              className="mt-3 inline-block text-sm font-medium text-[var(--color-accent-500)] transition-colors hover:text-[var(--color-accent-400)]"
            >
              종목 검색하기 →
            </Link>
          </div>
        ) : items.length === 0 ? (
          <p className="py-12 text-center text-sm text-[var(--color-text-tertiary)]">
            최근 30일간 내부자 거래 내역이 없습니다
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border-subtle)]">
                  <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                    날짜
                  </th>
                  <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                    종목
                  </th>
                  <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                    이름
                  </th>
                  <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                    직위
                  </th>
                  <th className="pb-2 text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                    구분
                  </th>
                  <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                    변동
                  </th>
                  <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                    지분율
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={`${item.ticker}-${item.activity.id}`}
                    className="table-row-hover border-b border-[var(--color-border-subtle)] last:border-0"
                  >
                    <td className="py-2.5 font-mono text-xs text-[var(--color-text-secondary)]">
                      {item.activity.date}
                    </td>
                    <td className="py-2.5">
                      <Link
                        href={`/stock/${item.ticker}`}
                        className="font-mono text-xs text-[var(--color-accent-500)] transition-colors hover:text-[var(--color-accent-400)]"
                      >
                        {item.ticker}
                      </Link>
                    </td>
                    <td className="py-2.5 font-medium text-[var(--color-text-primary)]">
                      {item.activity.name}
                    </td>
                    <td className="py-2.5 text-[var(--color-text-tertiary)]">
                      {item.activity.position}
                    </td>
                    <td className="py-2.5 text-center">
                      <Badge
                        variant={
                          item.activity.type === "buy"
                            ? "green"
                            : item.activity.type === "sell"
                              ? "red"
                              : "gray"
                        }
                      >
                        {item.activity.type === "buy"
                          ? "매수 ↑"
                          : item.activity.type === "sell"
                            ? "매도 ↓"
                            : "기타"}
                      </Badge>
                    </td>
                    <td
                      className={`py-2.5 text-right tabular-nums font-medium ${
                        item.activity.type === "buy"
                          ? "text-[var(--color-gain)]"
                          : item.activity.type === "sell"
                            ? "text-[var(--color-loss)]"
                            : "text-[var(--color-text-secondary)]"
                      }`}
                    >
                      {item.activity.shares > 0 ? "+" : ""}
                      {formatShares(item.activity.shares)}
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-[var(--color-text-secondary)]">
                      {item.activity.ratio.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
