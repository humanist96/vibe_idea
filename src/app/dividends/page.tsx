"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { Banknote, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { useWatchlistStore } from "@/store/watchlist"

interface DividendRow {
  readonly ticker: string
  readonly corpName: string
  readonly year: number
  readonly dividendPerShare: number
  readonly prevDividendPerShare: number
  readonly dividendYield: number
  readonly payoutRatio: number
  readonly dividendType: string
}

type SortKey = "corpName" | "dividendPerShare" | "dividendYield" | "payoutRatio" | "change"
type SortDir = "asc" | "desc"

const YEAR_OPTIONS = [
  new Date().getFullYear() - 1,
  new Date().getFullYear() - 2,
  new Date().getFullYear() - 3,
]

export default function DividendsPage() {
  const tickers = useWatchlistStore((s) => s.tickers)
  const [data, setData] = useState<DividendRow[]>([])
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(YEAR_OPTIONS[0])
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
        const res = await fetch("/api/dividends", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tickers, year }),
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
  }, [tickers, year])

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
        case "corpName":
          cmp = a.corpName.localeCompare(b.corpName)
          break
        case "dividendPerShare":
          cmp = a.dividendPerShare - b.dividendPerShare
          break
        case "dividendYield":
          cmp = a.dividendYield - b.dividendYield
          break
        case "payoutRatio":
          cmp = a.payoutRatio - b.payoutRatio
          break
        case "change":
          cmp =
            (a.dividendPerShare - a.prevDividendPerShare) -
            (b.dividendPerShare - b.prevDividendPerShare)
          break
      }
      return sortDir === "asc" ? cmp : -cmp
    })
  }, [data, sortKey, sortDir])

  const totalDivStocks = data.filter((d) => d.dividendPerShare > 0).length
  const avgYield =
    totalDivStocks > 0
      ? data.reduce((s, d) => s + d.dividendYield, 0) / totalDivStocks
      : 0

  return (
    <div className="space-y-6">
      <div className="animate-fade-up flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            배당
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
            관심종목의 배당 현황 (DART 사업보고서 기준)
          </p>
        </div>

        <div className="flex gap-1 rounded-lg bg-[var(--color-surface-50)] p-1">
          {YEAR_OPTIONS.map((y) => (
            <Button
              key={y}
              variant={year === y ? "primary" : "ghost"}
              size="sm"
              onClick={() => setYear(y)}
            >
              {y}년
            </Button>
          ))}
        </div>
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
          <div className="py-12 text-center">
            <p className="text-sm text-[var(--color-text-tertiary)]">
              관심종목을 추가하면 배당 현황을 확인할 수 있습니다
            </p>
            <Link
              href="/screener"
              className="mt-3 inline-block text-sm font-medium text-[var(--color-accent-500)] transition-colors hover:text-[var(--color-accent-400)]"
            >
              종목 검색하기 →
            </Link>
          </div>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="animate-fade-up stagger-2 grid gap-4 sm:grid-cols-3">
            <div className="glass-card rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase text-[var(--color-text-muted)]">
                배당 종목
              </p>
              <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">
                {totalDivStocks}
                <span className="text-sm font-normal text-[var(--color-text-tertiary)]">
                  {" "}/{" "}{data.length}
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
                기준 사업연도
              </p>
              <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">
                {year}년
              </p>
            </div>
          </div>

          {/* Table */}
          <Card className="animate-fade-up stagger-3">
            <CardHeader>
              <CardTitle>
                <span className="flex items-center gap-2">
                  <Banknote className="h-3.5 w-3.5 text-[var(--color-accent-500)]" />
                  배당 현황
                  <span className="text-xs font-normal text-[var(--color-text-tertiary)]">
                    ({sorted.length}종목)
                  </span>
                </span>
              </CardTitle>
            </CardHeader>

            {sorted.length === 0 ? (
              <p className="py-12 text-center text-sm text-[var(--color-text-tertiary)]">
                {year}년 배당 데이터가 없습니다
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-border-subtle)]">
                      {[
                        { key: "corpName" as const, label: "종목", align: "left" },
                        { key: "dividendPerShare" as const, label: "주당배당금", align: "right" },
                        { key: "change" as const, label: "전기대비", align: "right" },
                        { key: "dividendYield" as const, label: "배당수익률", align: "right" },
                        { key: "payoutRatio" as const, label: "배당성향", align: "right" },
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
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((row) => {
                      const divChange = row.dividendPerShare - row.prevDividendPerShare
                      return (
                        <tr
                          key={row.ticker}
                          className="table-row-hover border-b border-[var(--color-border-subtle)] last:border-0"
                        >
                          <td className="py-2.5">
                            <Link
                              href={`/stock/${row.ticker}`}
                              className="font-mono text-xs text-[var(--color-accent-500)] transition-colors hover:text-[var(--color-accent-400)]"
                            >
                              {row.ticker}
                            </Link>
                            <span className="ml-2 text-xs text-[var(--color-text-secondary)]">
                              {row.corpName}
                            </span>
                          </td>
                          <td className="py-2.5 text-right tabular-nums font-medium text-[var(--color-text-primary)]">
                            {row.dividendPerShare > 0
                              ? `₩${row.dividendPerShare.toLocaleString("ko-KR")}`
                              : "-"}
                          </td>
                          <td className="py-2.5 text-right">
                            {divChange !== 0 ? (
                              <span
                                className={cn(
                                  "inline-flex items-center gap-0.5 text-xs font-medium tabular-nums",
                                  divChange > 0
                                    ? "text-[var(--color-gain)]"
                                    : "text-[var(--color-loss)]"
                                )}
                              >
                                {divChange > 0 ? (
                                  <TrendingUp className="h-3 w-3" />
                                ) : (
                                  <TrendingDown className="h-3 w-3" />
                                )}
                                {divChange > 0 ? "+" : ""}
                                {divChange.toLocaleString("ko-KR")}
                              </span>
                            ) : (
                              <span className="text-xs text-[var(--color-text-tertiary)]">-</span>
                            )}
                          </td>
                          <td className="py-2.5 text-right tabular-nums font-medium text-[var(--color-accent-400)]">
                            {row.dividendYield > 0
                              ? `${row.dividendYield.toFixed(2)}%`
                              : "-"}
                          </td>
                          <td className="py-2.5 text-right tabular-nums text-[var(--color-text-secondary)]">
                            {row.payoutRatio > 0
                              ? `${row.payoutRatio.toFixed(1)}%`
                              : "-"}
                          </td>
                        </tr>
                      )
                    })}
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
