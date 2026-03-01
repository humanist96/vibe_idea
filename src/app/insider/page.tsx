"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import Link from "next/link"
import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { UserCheck, ChevronUp, ChevronDown, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { useWatchlistStore } from "@/store/watchlist"
import type { InsiderActivity } from "@/lib/api/dart-insider-types"

interface TickerActivity {
  readonly ticker: string
  readonly activity: InsiderActivity
}

interface StockSummary {
  readonly ticker: string
  readonly buyCount: number
  readonly sellCount: number
  readonly buyAvgShares: number
  readonly sellAvgShares: number
  readonly netShares: number
}

type PeriodDays = 7 | 30 | 90
type SortKey = "date" | "ticker" | "name" | "position" | "type" | "shares" | "ratio"
type SortDir = "asc" | "desc"

const PERIOD_OPTIONS: readonly { readonly label: string; readonly days: PeriodDays }[] = [
  { label: "7일", days: 7 },
  { label: "30일", days: 30 },
  { label: "90일", days: 90 },
]

const TYPE_ORDER: Record<string, number> = { buy: 0, sell: 1, other: 2 }

function compareItems(a: TickerActivity, b: TickerActivity, key: SortKey, dir: SortDir): number {
  let cmp = 0
  switch (key) {
    case "date": cmp = a.activity.date.localeCompare(b.activity.date); break
    case "ticker": cmp = a.ticker.localeCompare(b.ticker); break
    case "name": cmp = a.activity.name.localeCompare(b.activity.name); break
    case "position": cmp = a.activity.position.localeCompare(b.activity.position); break
    case "type": cmp = (TYPE_ORDER[a.activity.type] ?? 2) - (TYPE_ORDER[b.activity.type] ?? 2); break
    case "shares": cmp = a.activity.shares - b.activity.shares; break
    case "ratio": cmp = a.activity.ratio - b.activity.ratio; break
  }
  return dir === "asc" ? cmp : -cmp
}

function formatShares(shares: number): string {
  const abs = Math.abs(shares)
  if (abs >= 100_000_000) return `${(abs / 100_000_000).toFixed(1)}억`
  if (abs >= 10_000) return `${(abs / 10_000).toFixed(1)}만`
  return abs.toLocaleString("ko-KR")
}

function getDaysAgoDate(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

function buildStockSummaries(items: readonly TickerActivity[]): readonly StockSummary[] {
  const map = new Map<string, { buys: number[]; sells: number[] }>()

  for (const item of items) {
    const existing = map.get(item.ticker) ?? { buys: [], sells: [] }
    if (item.activity.type === "buy") {
      existing.buys = [...existing.buys, item.activity.shares]
    } else if (item.activity.type === "sell") {
      existing.sells = [...existing.sells, Math.abs(item.activity.shares)]
    }
    map.set(item.ticker, existing)
  }

  const summaries: StockSummary[] = []
  for (const [ticker, { buys, sells }] of map) {
    const buyTotal = buys.reduce((s, v) => s + v, 0)
    const sellTotal = sells.reduce((s, v) => s + v, 0)
    summaries.push({
      ticker,
      buyCount: buys.length,
      sellCount: sells.length,
      buyAvgShares: buys.length > 0 ? Math.round(buyTotal / buys.length) : 0,
      sellAvgShares: sells.length > 0 ? Math.round(sellTotal / sells.length) : 0,
      netShares: buyTotal - sellTotal,
    })
  }

  return summaries.sort((a, b) => Math.abs(b.netShares) - Math.abs(a.netShares))
}

function SortIcon({ active, dir }: { readonly active: boolean; readonly dir: SortDir }) {
  if (!active) return <ChevronDown className="h-3 w-3 text-[var(--color-text-muted)]" />
  return dir === "asc"
    ? <ChevronUp className="h-3 w-3 text-[var(--color-accent-500)]" />
    : <ChevronDown className="h-3 w-3 text-[var(--color-accent-500)]" />
}

interface SortableThProps {
  readonly label: string
  readonly sortKey: SortKey
  readonly currentKey: SortKey
  readonly currentDir: SortDir
  readonly onSort: (key: SortKey) => void
  readonly align?: "left" | "center" | "right"
}

function SortableTh({ label, sortKey, currentKey, currentDir, onSort, align = "left" }: SortableThProps) {
  const alignClass = align === "right" ? "justify-end" : align === "center" ? "justify-center" : "justify-start"
  return (
    <th className={cn("pb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]", align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left")}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn("inline-flex items-center gap-0.5 transition-colors hover:text-[var(--color-text-secondary)]", alignClass)}
      >
        {label}
        <SortIcon active={currentKey === sortKey} dir={currentDir} />
      </button>
    </th>
  )
}

function SummaryCard({
  summary,
  selected,
  onClick,
}: {
  readonly summary: StockSummary
  readonly selected: boolean
  readonly onClick: () => void
}) {
  const isBuyDominant = summary.netShares > 0
  const borderColor = isBuyDominant
    ? "border-l-[var(--color-gain)]"
    : summary.netShares < 0
      ? "border-l-[var(--color-loss)]"
      : "border-l-[var(--color-border-default)]"

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "glass-card w-full rounded-lg border-l-4 p-4 text-left transition-all duration-200",
        borderColor,
        selected
          ? "ring-2 ring-[var(--color-accent-500)] ring-offset-1 ring-offset-[var(--color-bg-primary)]"
          : "hover:bg-[var(--color-surface-100)]"
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <Link
          href={`/stock/${summary.ticker}`}
          onClick={(e) => e.stopPropagation()}
          className="font-mono text-sm font-bold text-[var(--color-accent-500)] transition-colors hover:text-[var(--color-accent-400)]"
        >
          {summary.ticker}
        </Link>
        <div className="flex items-center gap-1">
          {isBuyDominant ? (
            <TrendingUp className="h-3.5 w-3.5 text-[var(--color-gain)]" />
          ) : summary.netShares < 0 ? (
            <TrendingDown className="h-3.5 w-3.5 text-[var(--color-loss)]" />
          ) : null}
          <span
            className={cn(
              "text-xs font-semibold tabular-nums",
              isBuyDominant
                ? "text-[var(--color-gain)]"
                : summary.netShares < 0
                  ? "text-[var(--color-loss)]"
                  : "text-[var(--color-text-tertiary)]"
            )}
          >
            순매수 {summary.netShares > 0 ? "+" : ""}{formatShares(summary.netShares)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-[var(--color-text-tertiary)]">매수</span>
          <span className="font-medium text-[var(--color-gain)]">{summary.buyCount}건</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--color-text-tertiary)]">매도</span>
          <span className="font-medium text-[var(--color-loss)]">{summary.sellCount}건</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--color-text-tertiary)]">매수 평균</span>
          <span className="tabular-nums text-[var(--color-text-secondary)]">
            {summary.buyAvgShares > 0 ? formatShares(summary.buyAvgShares) : "-"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--color-text-tertiary)]">매도 평균</span>
          <span className="tabular-nums text-[var(--color-text-secondary)]">
            {summary.sellAvgShares > 0 ? formatShares(summary.sellAvgShares) : "-"}
          </span>
        </div>
      </div>
    </button>
  )
}

export default function InsiderPage() {
  const tickers = useWatchlistStore((s) => s.tickers)
  const [items, setItems] = useState<readonly TickerActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<PeriodDays>(30)
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>("date")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  useEffect(() => {
    if (tickers.length === 0) {
      setLoading(false)
      return
    }

    async function fetchAll() {
      try {
        setError(null)
        const res = await fetch("/api/insider/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tickers }),
        })
        const json = await res.json()
        if (!json.success || !json.data || typeof json.data !== "object") {
          setError(json.error ?? "데이터를 불러오는데 실패했습니다")
          return
        }

        const all: TickerActivity[] = []
        for (const [ticker, activities] of Object.entries(json.data)) {
          if (!Array.isArray(activities)) continue
          for (const activity of activities as InsiderActivity[]) {
            all.push({ ticker, activity })
          }
        }

        setItems(all)
      } catch (err) {
        console.error("[insider page] fetch failed:", err)
        setError("서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.")
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
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

  const handleTickerSelect = useCallback((ticker: string | null) => {
    setSelectedTicker((prev) => (prev === ticker ? null : ticker))
  }, [])

  // Period-filtered items
  const periodItems = useMemo(() => {
    const cutoff = getDaysAgoDate(period)
    return items.filter((item) => item.activity.date >= cutoff)
  }, [items, period])

  // Stock summaries from period-filtered items
  const stockSummaries = useMemo(
    () => buildStockSummaries(periodItems),
    [periodItems]
  )

  // Unique tickers from period items (for chip bar)
  const availableTickers = useMemo(
    () => stockSummaries.map((s) => s.ticker),
    [stockSummaries]
  )

  // Reset selectedTicker if it's no longer available
  useEffect(() => {
    if (selectedTicker && !availableTickers.includes(selectedTicker)) {
      setSelectedTicker(null)
    }
  }, [availableTickers, selectedTicker])

  // Final filtered + sorted items for table
  const filteredSorted = useMemo(() => {
    const filtered = selectedTicker
      ? periodItems.filter((item) => item.ticker === selectedTicker)
      : periodItems
    return [...filtered].sort((a, b) => compareItems(a, b, sortKey, sortDir))
  }, [periodItems, selectedTicker, sortKey, sortDir])

  return (
    <div className="space-y-6">
      {/* Header + Period Tabs */}
      <div className="animate-fade-up flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            내부자 거래
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
            관심종목의 최근 내부자 거래 현황 (임원·최대주주 지분 변동)
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <LoadingSkeleton className="h-32 w-full rounded-lg" />
            <LoadingSkeleton className="h-32 w-full rounded-lg" />
            <LoadingSkeleton className="h-32 w-full rounded-lg" />
          </div>
          <LoadingSkeleton className="h-10 w-full" />
          <LoadingSkeleton className="h-10 w-full" />
          <LoadingSkeleton className="h-10 w-full" />
        </div>
      ) : error ? (
        <Card className="animate-fade-up stagger-2">
          <div className="py-12 text-center">
            <p className="text-sm text-red-500">{error}</p>
            <button
              type="button"
              onClick={() => {
                setLoading(true)
                setError(null)
                setItems([])
                // re-trigger useEffect by forcing re-render
                window.location.reload()
              }}
              className="mt-3 inline-block text-sm font-medium text-[var(--color-accent-500)] transition-colors hover:text-[var(--color-accent-400)]"
            >
              다시 시도 →
            </button>
          </div>
        </Card>
      ) : tickers.length === 0 ? (
        <Card className="animate-fade-up stagger-2">
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
        </Card>
      ) : (
        <>
          {/* Stock Summary Cards */}
          {stockSummaries.length > 0 && (
            <div className="animate-fade-up stagger-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {stockSummaries.map((summary) => (
                <SummaryCard
                  key={summary.ticker}
                  summary={summary}
                  selected={selectedTicker === summary.ticker}
                  onClick={() => handleTickerSelect(summary.ticker)}
                />
              ))}
            </div>
          )}

          {/* Ticker Filter Chips */}
          {availableTickers.length > 1 && (
            <div className="animate-fade-up stagger-3 flex flex-wrap gap-2">
              <Button
                variant={selectedTicker === null ? "primary" : "ghost"}
                size="sm"
                onClick={() => setSelectedTicker(null)}
              >
                전체
              </Button>
              {availableTickers.map((ticker) => (
                <Button
                  key={ticker}
                  variant={selectedTicker === ticker ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => handleTickerSelect(ticker)}
                >
                  {ticker}
                </Button>
              ))}
            </div>
          )}

          {/* Table */}
          <Card className="animate-fade-up stagger-4">
            <CardHeader>
              <CardTitle>
                <span className="flex items-center gap-2">
                  <UserCheck className="h-3.5 w-3.5 text-[var(--color-accent-500)]" />
                  {selectedTicker ? `${selectedTicker} 내부자 거래` : "전체 내부자 거래"}
                  <span className="text-xs font-normal text-[var(--color-text-tertiary)]">
                    ({filteredSorted.length}건)
                  </span>
                </span>
              </CardTitle>
            </CardHeader>

            {filteredSorted.length === 0 ? (
              <p className="py-12 text-center text-sm text-[var(--color-text-tertiary)]">
                최근 {period}일간 내부자 거래 내역이 없습니다
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-border-subtle)]">
                      <SortableTh label="날짜" sortKey="date" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                      <SortableTh label="종목" sortKey="ticker" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                      <SortableTh label="이름" sortKey="name" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                      <SortableTh label="직위" sortKey="position" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                      <SortableTh label="구분" sortKey="type" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} align="center" />
                      <SortableTh label="변동" sortKey="shares" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} align="right" />
                      <SortableTh label="지분율" sortKey="ratio" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} align="right" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSorted.map((item) => (
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
                          className={cn(
                            "py-2.5 text-right tabular-nums font-medium",
                            item.activity.type === "buy"
                              ? "text-[var(--color-gain)]"
                              : item.activity.type === "sell"
                                ? "text-[var(--color-loss)]"
                                : "text-[var(--color-text-secondary)]"
                          )}
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
        </>
      )}
    </div>
  )
}
