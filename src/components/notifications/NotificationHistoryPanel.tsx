"use client"

import { useState, useEffect, useCallback } from "react"
import { Trash2, ChevronLeft, ChevronRight } from "lucide-react"

interface HistoryNotification {
  readonly id: string
  readonly ticker: string | null
  readonly stockName: string | null
  readonly type: string
  readonly message: string
  readonly severity: string
  readonly read: boolean
  readonly createdAt: string
}

interface HistoryMeta {
  readonly total: number
  readonly page: number
  readonly limit: number
  readonly totalPages: number
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

const SEVERITY_COLORS: Record<string, string> = {
  info: "bg-blue-100 text-blue-700",
  warning: "bg-amber-100 text-amber-700",
  critical: "bg-red-100 text-red-700",
}

const SEVERITY_DOT: Record<string, string> = {
  info: "bg-blue-400",
  warning: "bg-amber-400",
  critical: "bg-red-500",
}

export function NotificationHistoryPanel() {
  const [notifications, setNotifications] = useState<readonly HistoryNotification[]>([])
  const [meta, setMeta] = useState<HistoryMeta>({ total: 0, page: 1, limit: 20, totalPages: 0 })
  const [loading, setLoading] = useState(true)

  const [filterType, setFilterType] = useState<string>("all")
  const [filterSeverity, setFilterSeverity] = useState<string>("all")
  const [filterTicker, setFilterTicker] = useState("")
  const [filterUnread, setFilterUnread] = useState(false)
  const [page, setPage] = useState(1)

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("limit", "20")

      if (filterType !== "all") params.set("type", filterType)
      if (filterSeverity !== "all") params.set("severity", filterSeverity)
      if (filterTicker.trim()) params.set("ticker", filterTicker.trim().toUpperCase())
      if (filterUnread) params.set("read", "false")

      const res = await fetch(`/api/user/notifications/history?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setNotifications(json.data ?? [])
        setMeta(json.meta ?? { total: 0, page: 1, limit: 20, totalPages: 0 })
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false)
    }
  }, [page, filterType, filterSeverity, filterTicker, filterUnread])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const handleDelete = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/user/notifications/${id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
      }
    } catch {
      // Silently fail
    }
  }, [])

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage)
  }, [])

  return (
    <div
      className={
        "rounded-xl border border-[var(--color-border-default)] " +
        "bg-white overflow-hidden"
      }
    >
      <div className="border-b border-[var(--color-border-subtle)] px-4 py-3">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
          알림 히스토리
        </h3>
      </div>

      {/* Filters */}
      <div className="border-b border-[var(--color-border-subtle)] px-4 py-3">
        <div className="flex flex-wrap gap-2">
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setPage(1) }}
            className={
              "rounded-lg px-2.5 py-1.5 text-xs outline-none " +
              "bg-[var(--color-surface-100)] text-[var(--color-text-primary)] " +
              "ring-1 ring-[var(--color-border-default)] " +
              "focus:ring-[var(--color-accent-400)]"
            }
          >
            <option value="all">전체 유형</option>
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <select
            value={filterSeverity}
            onChange={(e) => { setFilterSeverity(e.target.value); setPage(1) }}
            className={
              "rounded-lg px-2.5 py-1.5 text-xs outline-none " +
              "bg-[var(--color-surface-100)] text-[var(--color-text-primary)] " +
              "ring-1 ring-[var(--color-border-default)] " +
              "focus:ring-[var(--color-accent-400)]"
            }
          >
            <option value="all">전체 심각도</option>
            <option value="info">정보</option>
            <option value="warning">경고</option>
            <option value="critical">긴급</option>
          </select>

          <input
            type="text"
            value={filterTicker}
            onChange={(e) => { setFilterTicker(e.target.value); setPage(1) }}
            placeholder="종목코드"
            className={
              "w-24 rounded-lg px-2.5 py-1.5 text-xs outline-none " +
              "bg-[var(--color-surface-100)] text-[var(--color-text-primary)] " +
              "ring-1 ring-[var(--color-border-default)] " +
              "placeholder:text-[var(--color-text-muted)] " +
              "focus:ring-[var(--color-accent-400)]"
            }
          />

          <label className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
            <input
              type="checkbox"
              checked={filterUnread}
              onChange={(e) => { setFilterUnread(e.target.checked); setPage(1) }}
              className="rounded"
            />
            읽지 않음만
          </label>
        </div>
      </div>

      {/* List */}
      <div className="max-h-[500px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-border-default)] border-t-[var(--color-accent-500)]" />
          </div>
        ) : notifications.length === 0 ? (
          <p className="px-4 py-8 text-center text-xs text-[var(--color-text-tertiary)]">
            알림 히스토리가 없습니다
          </p>
        ) : (
          <div className="divide-y divide-[var(--color-border-subtle)]">
            {notifications.map((n) => {
              const severityDot = SEVERITY_DOT[n.severity] ?? "bg-gray-400"
              const severityBadge = SEVERITY_COLORS[n.severity] ?? "bg-gray-100 text-gray-700"

              return (
                <div
                  key={n.id}
                  className={
                    "flex items-start gap-3 px-4 py-3 " +
                    (n.read ? "" : "bg-[var(--color-surface-50)]/50")
                  }
                >
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${severityDot}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-[var(--color-text-primary)]">
                      {n.message}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      {n.ticker && (
                        <span className="font-mono text-[10px] text-[var(--color-text-tertiary)]">
                          {n.ticker}
                        </span>
                      )}
                      <span className={`rounded px-1.5 py-0.5 text-[9px] font-medium ${severityBadge}`}>
                        {n.severity === "critical" ? "긴급" : n.severity === "warning" ? "경고" : "정보"}
                      </span>
                      <span className="text-[10px] text-[var(--color-text-muted)]">
                        {new Date(n.createdAt).toLocaleDateString("ko-KR", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(n.id)}
                    className={
                      "rounded-lg p-1 transition-colors " +
                      "text-[var(--color-text-tertiary)] hover:bg-red-50 hover:text-red-500"
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[var(--color-border-subtle)] px-4 py-2">
          <span className="text-xs text-[var(--color-text-tertiary)]">
            {meta.total}개 중 {((meta.page - 1) * meta.limit) + 1}-{Math.min(meta.page * meta.limit, meta.total)}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
              className={
                "rounded-lg p-1 transition-colors " +
                "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-100)] " +
                "disabled:opacity-30 disabled:cursor-not-allowed"
              }
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 text-xs font-medium text-[var(--color-text-secondary)]">
              {page} / {meta.totalPages}
            </span>
            <button
              type="button"
              disabled={page >= meta.totalPages}
              onClick={() => handlePageChange(page + 1)}
              className={
                "rounded-lg p-1 transition-colors " +
                "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-100)] " +
                "disabled:opacity-30 disabled:cursor-not-allowed"
              }
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
