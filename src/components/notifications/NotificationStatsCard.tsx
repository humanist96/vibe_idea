"use client"

import { useState, useEffect, useCallback } from "react"
import { BarChart3, Bell, TrendingUp } from "lucide-react"

interface NotificationStats {
  readonly totalCount: number
  readonly byType: Record<string, number>
  readonly bySeverity: Record<string, number>
  readonly topTickers: ReadonlyArray<{ readonly ticker: string; readonly count: number }>
  readonly dailyCounts: ReadonlyArray<{ readonly date: string; readonly count: number }>
  readonly hitRate: number
}

const TYPE_LABELS: Record<string, string> = {
  breakout_resistance: "저항선 돌파",
  breakdown_support: "지지선 이탈",
  earnings_surprise: "실적 서프라이즈",
  foreign_bulk_buy: "외국인 대량 매수",
  institution_bulk_buy: "기관 대량 매수",
  price_surge: "가격 급등",
  price_drop: "가격 급락",
  market_alert: "시장 알림",
  earnings_alert: "실적 알림",
}

const TYPE_COLORS: Record<string, string> = {
  breakout_resistance: "bg-emerald-500",
  breakdown_support: "bg-red-500",
  earnings_surprise: "bg-purple-500",
  foreign_bulk_buy: "bg-sky-500",
  institution_bulk_buy: "bg-indigo-500",
  price_surge: "bg-emerald-400",
  price_drop: "bg-red-400",
  market_alert: "bg-orange-400",
  earnings_alert: "bg-blue-400",
}

export function NotificationStatsCard() {
  const [stats, setStats] = useState<NotificationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/user/notifications/stats?days=${days}`)
      if (res.ok) {
        const json = await res.json()
        setStats(json.data ?? null)
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  if (loading) {
    return (
      <div
        className={
          "rounded-xl border border-[var(--color-border-default)] " +
          "bg-white p-6"
        }
      >
        <div className="flex items-center justify-center py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-border-default)] border-t-[var(--color-accent-500)]" />
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div
        className={
          "rounded-xl border border-[var(--color-border-default)] " +
          "bg-white p-6 text-center"
        }
      >
        <p className="text-sm text-[var(--color-text-tertiary)]">
          통계 데이터를 불러올 수 없습니다
        </p>
      </div>
    )
  }

  const maxDailyCount = Math.max(
    ...stats.dailyCounts.map((d) => d.count),
    1
  )

  const typeEntries = Object.entries(stats.byType)
    .sort(([, a], [, b]) => b - a)

  return (
    <div
      className={
        "rounded-xl border border-[var(--color-border-default)] " +
        "bg-white overflow-hidden"
      }
    >
      <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
          <BarChart3 className="h-4 w-4" />
          알림 통계
        </h3>
        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value, 10))}
          className={
            "rounded-lg px-2 py-1 text-xs outline-none " +
            "bg-[var(--color-surface-100)] text-[var(--color-text-secondary)] " +
            "ring-1 ring-[var(--color-border-default)]"
          }
        >
          <option value={7}>7일</option>
          <option value={30}>30일</option>
          <option value={90}>90일</option>
        </select>
      </div>

      <div className="p-4 space-y-5">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-[var(--color-surface-50)] p-3 text-center">
            <Bell className="mx-auto h-4 w-4 text-[var(--color-text-tertiary)]" />
            <p className="mt-1 text-lg font-bold text-[var(--color-text-primary)]">
              {stats.totalCount}
            </p>
            <p className="text-[10px] text-[var(--color-text-tertiary)]">총 알림</p>
          </div>
          <div className="rounded-lg bg-[var(--color-surface-50)] p-3 text-center">
            <p className="text-lg font-bold text-amber-500">
              {stats.bySeverity.warning ?? 0}
            </p>
            <p className="text-[10px] text-[var(--color-text-tertiary)]">경고</p>
          </div>
          <div className="rounded-lg bg-[var(--color-surface-50)] p-3 text-center">
            <p className="text-lg font-bold text-red-500">
              {stats.bySeverity.critical ?? 0}
            </p>
            <p className="text-[10px] text-[var(--color-text-tertiary)]">긴급</p>
          </div>
        </div>

        {/* Type distribution */}
        {typeEntries.length > 0 && (
          <div>
            <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
              유형별 분포
            </p>
            <div className="space-y-1.5">
              {typeEntries.map(([type, count]) => {
                const pct = stats.totalCount > 0
                  ? (count / stats.totalCount) * 100
                  : 0
                const color = TYPE_COLORS[type] ?? "bg-gray-400"
                const label = TYPE_LABELS[type] ?? type

                return (
                  <div key={type} className="flex items-center gap-2">
                    <span className="w-24 truncate text-xs text-[var(--color-text-secondary)]">
                      {label}
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-[var(--color-surface-100)] overflow-hidden">
                      <div
                        className={`h-full rounded-full ${color}`}
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-[10px] font-medium text-[var(--color-text-tertiary)]">
                      {count}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Top tickers */}
        {stats.topTickers.length > 0 && (
          <div>
            <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              Top 종목
            </p>
            <div className="flex flex-wrap gap-1.5">
              {stats.topTickers.slice(0, 8).map((t) => (
                <span
                  key={t.ticker}
                  className={
                    "rounded-lg px-2.5 py-1 text-xs font-medium " +
                    "bg-[var(--color-surface-100)] text-[var(--color-text-secondary)]"
                  }
                >
                  {t.ticker}
                  <span className="ml-1 text-[10px] text-[var(--color-text-muted)]">
                    {t.count}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Daily bar chart */}
        {stats.dailyCounts.length > 0 && (
          <div>
            <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
              일별 알림 수
            </p>
            <div className="flex items-end gap-px h-16">
              {stats.dailyCounts.slice(-30).map((d) => {
                const heightPct = (d.count / maxDailyCount) * 100

                return (
                  <div
                    key={d.date}
                    className="flex-1 min-w-[3px] group relative"
                  >
                    <div
                      className="w-full rounded-t bg-[var(--color-accent-400)] transition-all hover:bg-[var(--color-accent-500)]"
                      style={{ height: `${Math.max(heightPct, 4)}%` }}
                    />
                    <div
                      className={
                        "absolute bottom-full left-1/2 -translate-x-1/2 mb-1 " +
                        "hidden group-hover:block whitespace-nowrap " +
                        "rounded bg-gray-800 px-1.5 py-0.5 text-[9px] text-white"
                      }
                    >
                      {d.date.slice(5)} : {d.count}건
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
