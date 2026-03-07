"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { ArrowLeftRight, TrendingUp, TrendingDown } from "lucide-react"
import { EmptyWatchlist } from "@/components/ui/EmptyWatchlist"
import { cn } from "@/lib/utils/cn"
import { useWatchlistStore } from "@/store/watchlist"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import type { InvestorFlowEntry } from "@/lib/api/naver-investor-types"

interface TickerFlow {
  readonly ticker: string
  readonly entries: readonly InvestorFlowEntry[]
}

function formatVolume(v: number): string {
  const abs = Math.abs(v)
  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${(v / 1_000).toFixed(0)}K`
  return v.toLocaleString("ko-KR")
}

export default function FlowPage() {
  const tickers = useWatchlistStore((s) => s.tickers)
  const [flows, setFlows] = useState<TickerFlow[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null)

  useEffect(() => {
    if (tickers.length === 0) {
      setLoading(false)
      return
    }

    async function fetchAll() {
      try {
        const results = await Promise.all(
          tickers.slice(0, 20).map(async (ticker) => {
            const res = await fetch(`/api/stocks/${ticker}/investor`)
            const json = await res.json()
            if (!json.success) return null
            return { ticker, entries: json.data.entries ?? [] } as TickerFlow
          })
        )
        setFlows(results.filter((r): r is TickerFlow => r !== null && r.entries.length > 0))
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [tickers])

  const summaryData = useMemo(() => {
    return flows.map((f) => {
      const latest = f.entries[0]
      const recentEntries = f.entries.slice(0, 5)
      const foreignSum = recentEntries.reduce((s, e) => s + e.foreignNet, 0)
      const instSum = recentEntries.reduce((s, e) => s + e.institutionNet, 0)
      return {
        ticker: f.ticker,
        foreignNet: latest?.foreignNet ?? 0,
        institutionNet: latest?.institutionNet ?? 0,
        foreignRatio: latest?.foreignRatio ?? 0,
        close: latest?.close ?? 0,
        changePercent: latest?.changePercent ?? 0,
        foreign5d: foreignSum,
        inst5d: instSum,
      }
    }).sort((a, b) => Math.abs(b.foreignNet) - Math.abs(a.foreignNet))
  }, [flows])

  const selectedFlow = useMemo(() => {
    if (!selectedTicker) return null
    return flows.find((f) => f.ticker === selectedTicker) ?? null
  }, [flows, selectedTicker])

  const chartData = useMemo(() => {
    if (!selectedFlow) return []
    return [...selectedFlow.entries]
      .reverse()
      .slice(-20)
      .map((e) => ({
        date: e.date.slice(5),
        외국인: e.foreignNet,
        기관: e.institutionNet,
      }))
  }, [selectedFlow])

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          투자자 동향
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
          관심종목의 외국인·기관 순매매 현황
        </p>
      </div>

      {loading ? (
        <div className="space-y-4 animate-fade-up stagger-2">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <LoadingSkeleton className="h-28 w-full rounded-lg" />
            <LoadingSkeleton className="h-28 w-full rounded-lg" />
            <LoadingSkeleton className="h-28 w-full rounded-lg" />
          </div>
        </div>
      ) : tickers.length === 0 ? (
        <Card className="animate-fade-up stagger-2">
          <EmptyWatchlist
            title="투자자 동향을 확인하려면 종목을 추가하세요"
            description="관심종목을 등록하면 외국인·기관·개인의 매매 동향을 확인할 수 있습니다."
          />
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="animate-fade-up stagger-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {summaryData.map((s) => (
              <button
                key={s.ticker}
                type="button"
                onClick={() =>
                  setSelectedTicker((prev) =>
                    prev === s.ticker ? null : s.ticker
                  )
                }
                className={cn(
                  "glass-card w-full rounded-lg p-4 text-left transition-all duration-200",
                  selectedTicker === s.ticker
                    ? "ring-2 ring-[var(--color-accent-500)] ring-offset-1 ring-offset-[var(--color-bg-primary)]"
                    : "hover:bg-[var(--color-surface-100)]"
                )}
              >
                <div className="mb-3 flex items-center justify-between">
                  <Link
                    href={`/stock/${s.ticker}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-mono text-sm font-bold text-[var(--color-accent-500)] transition-colors hover:text-[var(--color-accent-400)]"
                  >
                    {s.ticker}
                  </Link>
                  <span
                    className={cn(
                      "text-xs font-medium tabular-nums",
                      s.changePercent > 0
                        ? "text-[var(--color-gain)]"
                        : s.changePercent < 0
                          ? "text-[var(--color-loss)]"
                          : "text-[var(--color-text-tertiary)]"
                    )}
                  >
                    {s.changePercent > 0 ? "+" : ""}
                    {s.changePercent.toFixed(2)}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <div>
                    <p className="text-[var(--color-text-muted)]">외국인</p>
                    <p
                      className={cn(
                        "font-semibold tabular-nums",
                        s.foreignNet > 0
                          ? "text-[var(--color-gain)]"
                          : s.foreignNet < 0
                            ? "text-[var(--color-loss)]"
                            : "text-[var(--color-text-secondary)]"
                      )}
                    >
                      {s.foreignNet > 0 ? "+" : ""}
                      {formatVolume(s.foreignNet)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[var(--color-text-muted)]">기관</p>
                    <p
                      className={cn(
                        "font-semibold tabular-nums",
                        s.institutionNet > 0
                          ? "text-[var(--color-gain)]"
                          : s.institutionNet < 0
                            ? "text-[var(--color-loss)]"
                            : "text-[var(--color-text-secondary)]"
                      )}
                    >
                      {s.institutionNet > 0 ? "+" : ""}
                      {formatVolume(s.institutionNet)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[var(--color-text-muted)]">5일 외국인</p>
                    <div className="flex items-center gap-1">
                      {s.foreign5d > 0 ? (
                        <TrendingUp className="h-3 w-3 text-[var(--color-gain)]" />
                      ) : s.foreign5d < 0 ? (
                        <TrendingDown className="h-3 w-3 text-[var(--color-loss)]" />
                      ) : null}
                      <span className="tabular-nums text-[var(--color-text-secondary)]">
                        {formatVolume(s.foreign5d)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[var(--color-text-muted)]">외국인 보유</p>
                    <span className="tabular-nums text-[var(--color-text-secondary)]">
                      {s.foreignRatio.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Detail Chart */}
          {selectedFlow && chartData.length > 0 && (
            <Card className="animate-fade-up">
              <CardHeader>
                <CardTitle>
                  <span className="flex items-center gap-2">
                    <ArrowLeftRight className="h-3.5 w-3.5 text-[var(--color-accent-500)]" />
                    {selectedTicker} 순매매 추이 (최근 20일)
                  </span>
                </CardTitle>
              </CardHeader>
              <div className="h-64 px-2 pb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barGap={0} barCategoryGap="20%">
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => formatVolume(v)}
                      width={55}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--color-midnight-800)",
                        border: "1px solid var(--color-border-subtle)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(value: number) => [formatVolume(value), ""]}
                    />
                    <ReferenceLine y={0} stroke="var(--color-border-default)" />
                    <Bar
                      dataKey="외국인"
                      fill="var(--color-accent-400)"
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar dataKey="기관" fill="#6366f1" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* Table */}
          <Card className="animate-fade-up stagger-3">
            <CardHeader>
              <CardTitle>
                <span className="flex items-center gap-2">
                  <ArrowLeftRight className="h-3.5 w-3.5 text-[var(--color-accent-500)]" />
                  종합 현황
                  <span className="text-xs font-normal text-[var(--color-text-tertiary)]">
                    ({summaryData.length}종목)
                  </span>
                </span>
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border-subtle)]">
                    <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      종목
                    </th>
                    <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      종가
                    </th>
                    <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      등락률
                    </th>
                    <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      외국인
                    </th>
                    <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      기관
                    </th>
                    <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      외국인 보유율
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {summaryData.map((s) => (
                    <tr
                      key={s.ticker}
                      className="table-row-hover border-b border-[var(--color-border-subtle)] last:border-0"
                    >
                      <td className="py-2.5">
                        <Link
                          href={`/stock/${s.ticker}`}
                          className="font-mono text-xs text-[var(--color-accent-500)] transition-colors hover:text-[var(--color-accent-400)]"
                        >
                          {s.ticker}
                        </Link>
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-[var(--color-text-primary)]">
                        {s.close.toLocaleString("ko-KR")}
                      </td>
                      <td
                        className={cn(
                          "py-2.5 text-right tabular-nums font-medium",
                          s.changePercent > 0
                            ? "text-[var(--color-gain)]"
                            : s.changePercent < 0
                              ? "text-[var(--color-loss)]"
                              : "text-[var(--color-text-secondary)]"
                        )}
                      >
                        {s.changePercent > 0 ? "+" : ""}
                        {s.changePercent.toFixed(2)}%
                      </td>
                      <td
                        className={cn(
                          "py-2.5 text-right tabular-nums font-medium",
                          s.foreignNet > 0
                            ? "text-[var(--color-gain)]"
                            : s.foreignNet < 0
                              ? "text-[var(--color-loss)]"
                              : "text-[var(--color-text-secondary)]"
                        )}
                      >
                        {s.foreignNet > 0 ? "+" : ""}
                        {formatVolume(s.foreignNet)}
                      </td>
                      <td
                        className={cn(
                          "py-2.5 text-right tabular-nums font-medium",
                          s.institutionNet > 0
                            ? "text-[var(--color-gain)]"
                            : s.institutionNet < 0
                              ? "text-[var(--color-loss)]"
                              : "text-[var(--color-text-secondary)]"
                        )}
                      >
                        {s.institutionNet > 0 ? "+" : ""}
                        {formatVolume(s.institutionNet)}
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-[var(--color-text-secondary)]">
                        {s.foreignRatio.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
