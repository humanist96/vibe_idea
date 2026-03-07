"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import Link from "next/link"
import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { Building2, ChevronUp, ChevronDown } from "lucide-react"
import { EmptyWatchlist } from "@/components/ui/EmptyWatchlist"
import { cn } from "@/lib/utils/cn"
import { useWatchlistStore } from "@/store/watchlist"

interface HoldingRow {
  readonly ticker: string
  readonly corpName: string
  readonly reportDate: string
  readonly reportType: string
  readonly reporter: string
  readonly shares: number
  readonly sharesChange: number
  readonly ratio: number
  readonly ratioChange: number
}

type SortKey = "reportDate" | "ticker" | "reporter" | "shares" | "ratio" | "ratioChange"
type SortDir = "asc" | "desc"
type PeriodDays = 30 | 90 | 365

const PERIOD_OPTIONS: readonly { readonly label: string; readonly days: PeriodDays }[] = [
  { label: "30일", days: 30 },
  { label: "90일", days: 90 },
  { label: "1년", days: 365 },
]

function getDaysAgoDate(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

function formatShares(shares: number): string {
  const abs = Math.abs(shares)
  if (abs >= 100_000_000) return `${(shares / 100_000_000).toFixed(1)}억`
  if (abs >= 10_000) return `${(shares / 10_000).toFixed(1)}만`
  return shares.toLocaleString("ko-KR")
}

function SortIcon({ active, dir }: { readonly active: boolean; readonly dir: SortDir }) {
  if (!active) return <ChevronDown className="h-3 w-3 text-[var(--color-text-muted)]" />
  return dir === "asc"
    ? <ChevronUp className="h-3 w-3 text-[var(--color-accent-500)]" />
    : <ChevronDown className="h-3 w-3 text-[var(--color-accent-500)]" />
}

export default function BlockHoldingsPage() {
  const tickers = useWatchlistStore((s) => s.tickers)
  const [data, setData] = useState<HoldingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<PeriodDays>(90)
  const [sortKey, setSortKey] = useState<SortKey>("reportDate")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null)

  useEffect(() => {
    if (tickers.length === 0) {
      setLoading(false)
      return
    }

    async function fetchData() {
      try {
        const res = await fetch("/api/block-holdings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tickers }),
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

  const handleSort = useCallback((key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"))
        return key
      }
      setSortDir("desc")
      return key
    })
  }, [])

  const filtered = useMemo(() => {
    const cutoff = getDaysAgoDate(period)
    let items = data.filter((h) => h.reportDate >= cutoff)
    if (selectedTicker) {
      items = items.filter((h) => h.ticker === selectedTicker)
    }
    return items
  }, [data, period, selectedTicker])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case "reportDate": cmp = a.reportDate.localeCompare(b.reportDate); break
        case "ticker": cmp = a.ticker.localeCompare(b.ticker); break
        case "reporter": cmp = a.reporter.localeCompare(b.reporter); break
        case "shares": cmp = a.shares - b.shares; break
        case "ratio": cmp = a.ratio - b.ratio; break
        case "ratioChange": cmp = a.ratioChange - b.ratioChange; break
      }
      return sortDir === "asc" ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir])

  const uniqueTickers = useMemo(() => {
    return [...new Set(data.map((h) => h.ticker))]
  }, [data])

  return (
    <div className="space-y-6">
      <div className="animate-fade-up flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            대량보유 보고서
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
            관심종목의 5% 이상 대량보유 보고 현황
          </p>
        </div>

        <div className="flex gap-1 rounded-lg bg-[var(--color-surface-50)] p-1">
          {PERIOD_OPTIONS.map((opt) => (
            <Button
              key={opt.days}
              variant={period === opt.days ? "primary" : "ghost"}
              size="sm"
              onClick={() => setPeriod(opt.days)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4 animate-fade-up stagger-2">
          <LoadingSkeleton className="h-10 w-full" />
          <LoadingSkeleton className="h-10 w-full" />
          <LoadingSkeleton className="h-10 w-full" />
        </div>
      ) : tickers.length === 0 ? (
        <Card className="animate-fade-up stagger-2">
          <EmptyWatchlist
            title="대량보유 현황을 보려면 종목을 추가하세요"
            description="관심종목을 등록하면 5% 이상 대량보유 보고를 확인할 수 있습니다."
          />
        </Card>
      ) : (
        <>
          {/* Ticker Filter Chips */}
          {uniqueTickers.length > 1 && (
            <div className="animate-fade-up stagger-2 flex flex-wrap gap-2">
              <Button
                variant={selectedTicker === null ? "primary" : "ghost"}
                size="sm"
                onClick={() => setSelectedTicker(null)}
              >
                전체
              </Button>
              {uniqueTickers.map((ticker) => (
                <Button
                  key={ticker}
                  variant={selectedTicker === ticker ? "primary" : "ghost"}
                  size="sm"
                  onClick={() =>
                    setSelectedTicker((prev) =>
                      prev === ticker ? null : ticker
                    )
                  }
                >
                  {ticker}
                </Button>
              ))}
            </div>
          )}

          <Card className="animate-fade-up stagger-3">
            <CardHeader>
              <CardTitle>
                <span className="flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-[var(--color-accent-500)]" />
                  대량보유 변동
                  <span className="text-xs font-normal text-[var(--color-text-tertiary)]">
                    ({sorted.length}건)
                  </span>
                </span>
              </CardTitle>
            </CardHeader>

            {sorted.length === 0 ? (
              <p className="py-12 text-center text-sm text-[var(--color-text-tertiary)]">
                해당 기간 대량보유 보고서가 없습니다
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-border-subtle)]">
                      {([
                        { key: "reportDate", label: "보고일", align: "left" },
                        { key: "ticker", label: "종목", align: "left" },
                        { key: "reporter", label: "보고자", align: "left" },
                        { key: "shares", label: "보유주식수", align: "right" },
                        { key: "ratio", label: "보유비율", align: "right" },
                        { key: "ratioChange", label: "변동", align: "right" },
                      ] as const).map((col) => (
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
                            className={cn(
                              "inline-flex items-center gap-0.5 transition-colors hover:text-[var(--color-text-secondary)]",
                              col.align === "right" ? "justify-end" : "justify-start"
                            )}
                          >
                            {col.label}
                            <SortIcon active={sortKey === col.key} dir={sortDir} />
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((row, idx) => (
                      <tr
                        key={`${row.ticker}-${row.reportDate}-${idx}`}
                        className="table-row-hover border-b border-[var(--color-border-subtle)] last:border-0"
                      >
                        <td className="py-2.5 font-mono text-xs text-[var(--color-text-secondary)]">
                          {row.reportDate}
                        </td>
                        <td className="py-2.5">
                          <Link
                            href={`/stock/${row.ticker}`}
                            className="font-mono text-xs text-[var(--color-accent-500)] transition-colors hover:text-[var(--color-accent-400)]"
                          >
                            {row.ticker}
                          </Link>
                          <span className="ml-1.5 text-xs text-[var(--color-text-tertiary)]">
                            {row.corpName}
                          </span>
                        </td>
                        <td className="py-2.5 text-[var(--color-text-primary)]">
                          {row.reporter}
                        </td>
                        <td className="py-2.5 text-right tabular-nums text-[var(--color-text-secondary)]">
                          {formatShares(row.shares)}
                        </td>
                        <td className="py-2.5 text-right tabular-nums font-medium text-[var(--color-text-primary)]">
                          {row.ratio.toFixed(2)}%
                        </td>
                        <td
                          className={cn(
                            "py-2.5 text-right tabular-nums font-medium",
                            row.ratioChange > 0
                              ? "text-[var(--color-gain)]"
                              : row.ratioChange < 0
                                ? "text-[var(--color-loss)]"
                                : "text-[var(--color-text-tertiary)]"
                          )}
                        >
                          {row.ratioChange !== 0
                            ? `${row.ratioChange > 0 ? "+" : ""}${row.ratioChange.toFixed(2)}%p`
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
