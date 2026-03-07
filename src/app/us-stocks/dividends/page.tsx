"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { EmptyWatchlist } from "@/components/ui/EmptyWatchlist"
import { Banknote } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { useUSWatchlistStore } from "@/store/us-watchlist"

interface DividendRow {
  readonly symbol: string
  readonly name: string
  readonly nameKr: string
  readonly sector: string
  readonly dividendYield: number | null
  readonly dividendPerShare: number | null
  readonly history: readonly { exDate: string; amount: number }[]
}

type SortKey = "nameKr" | "dividendYield" | "dividendPerShare"
type SortDir = "asc" | "desc"

export default function USDividendsPage() {
  const tickers = useUSWatchlistStore((s) => s.tickers)
  const [data, setData] = useState<DividendRow[]>([])
  const [loading, setLoading] = useState(true)
  const [sortKey, setSortKey] = useState<SortKey>("dividendYield")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  useEffect(() => {
    if (tickers.length === 0) {
      setLoading(false)
      return
    }

    async function fetchData() {
      setLoading(true)
      try {
        const res = await fetch("/api/us-stocks/dividends", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symbols: tickers }),
        })
        const json = await res.json()
        if (json.success) setData(json.data)
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [tickers])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
  }

  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case "nameKr":
          cmp = a.nameKr.localeCompare(b.nameKr)
          break
        case "dividendYield":
          cmp = (a.dividendYield ?? 0) - (b.dividendYield ?? 0)
          break
        case "dividendPerShare":
          cmp = (a.dividendPerShare ?? 0) - (b.dividendPerShare ?? 0)
          break
      }
      return sortDir === "asc" ? cmp : -cmp
    })
  }, [data, sortKey, sortDir])

  const totalDivStocks = data.filter((d) => (d.dividendYield ?? 0) > 0).length
  const avgYield =
    totalDivStocks > 0
      ? data
          .filter((d) => (d.dividendYield ?? 0) > 0)
          .reduce((s, d) => s + (d.dividendYield ?? 0), 0) / totalDivStocks
      : 0

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          US 배당
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
          관심종목의 배당 현황 및 배당수익률 비교
        </p>
      </div>

      {loading ? (
        <div className="space-y-4 animate-fade-up stagger-2">
          <div className="grid gap-4 sm:grid-cols-3">
            <LoadingSkeleton className="h-20 w-full rounded-lg" />
            <LoadingSkeleton className="h-20 w-full rounded-lg" />
            <LoadingSkeleton className="h-20 w-full rounded-lg" />
          </div>
          <LoadingSkeleton className="h-64 w-full rounded-lg" />
        </div>
      ) : tickers.length === 0 ? (
        <Card className="animate-fade-up stagger-2">
          <EmptyWatchlist
            title="배당 데이터를 확인하려면 US 종목을 추가하세요"
            description="관심종목을 등록하면 배당 현황과 수익률을 비교할 수 있습니다."
          />
        </Card>
      ) : (
        <>
          <div className="animate-fade-up stagger-2 grid gap-4 sm:grid-cols-3">
            <div className="glass-card rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase text-[var(--color-text-muted)]">
                배당 종목
              </p>
              <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">
                {totalDivStocks}
                <span className="text-sm font-normal text-[var(--color-text-tertiary)]">
                  {" "}/ {data.length}
                </span>
              </p>
            </div>
            <div className="glass-card rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase text-[var(--color-text-muted)]">
                평균 배당수익률
              </p>
              <p className="mt-1 text-2xl font-bold text-[var(--color-accent-400)]">
                {avgYield.toFixed(2)}%
              </p>
            </div>
            <div className="glass-card rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase text-[var(--color-text-muted)]">
                관심종목 수
              </p>
              <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">
                {tickers.length}
              </p>
            </div>
          </div>

          <Card className="animate-fade-up stagger-3">
            <CardHeader>
              <CardTitle>
                <span className="flex items-center gap-2">
                  <Banknote className="h-3.5 w-3.5 text-[var(--color-accent-500)]" />
                  배당 현황 ({sorted.length}종목)
                </span>
              </CardTitle>
            </CardHeader>

            {sorted.length === 0 ? (
              <p className="py-12 text-center text-sm text-[var(--color-text-tertiary)]">
                배당 데이터가 없습니다
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-border-subtle)]">
                      {[
                        { key: "nameKr" as const, label: "종목", align: "left" },
                        { key: "dividendPerShare" as const, label: "연간 주당배당금", align: "right" },
                        { key: "dividendYield" as const, label: "배당수익률", align: "right" },
                      ].map((col) => (
                        <th
                          key={col.key}
                          className={cn(
                            "pb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]",
                            col.align === "right" ? "text-right" : "text-left"
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => handleSort(col.key)}
                            className="inline-flex items-center gap-0.5 transition-colors hover:text-[var(--color-text-secondary)]"
                          >
                            {col.label}
                          </button>
                        </th>
                      ))}
                      <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                        최근 배당
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((row) => (
                      <tr
                        key={row.symbol}
                        className="table-row-hover border-b border-[var(--color-border-subtle)] last:border-0"
                      >
                        <td className="py-2.5">
                          <Link
                            href={`/us-stocks/${row.symbol}`}
                            className="font-medium text-[var(--color-text-primary)] transition-colors hover:text-[var(--color-accent-500)]"
                          >
                            {row.nameKr}
                          </Link>
                          <span className="ml-1.5 font-mono text-xs text-[var(--color-text-muted)]">
                            {row.symbol}
                          </span>
                        </td>
                        <td className="py-2.5 text-right tabular-nums font-medium text-[var(--color-text-primary)]">
                          {row.dividendPerShare
                            ? `$${row.dividendPerShare.toFixed(2)}`
                            : "-"}
                        </td>
                        <td className="py-2.5 text-right tabular-nums font-medium text-[var(--color-accent-400)]">
                          {row.dividendYield
                            ? `${row.dividendYield.toFixed(2)}%`
                            : "-"}
                        </td>
                        <td className="py-2.5 text-right text-xs text-[var(--color-text-secondary)]">
                          {row.history[0]
                            ? `$${row.history[0].amount.toFixed(2)} (${row.history[0].exDate})`
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
