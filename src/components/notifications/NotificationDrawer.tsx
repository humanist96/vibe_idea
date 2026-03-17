"use client"

import { useCallback } from "react"
import { X, Trash2 } from "lucide-react"
import { useNotificationStore } from "@/store/notifications"
import type { NotificationType } from "@/store/notifications"

const TYPE_LABELS: Record<string, string> = {
  price_surge: "가격 급등",
  price_drop: "가격 급락",
  market_alert: "시장 알림",
  earnings_alert: "실적 알림",
  breakout_resistance: "저항선 돌파",
  breakdown_support: "지지선 이탈",
  earnings_surprise: "실적 서프라이즈",
  foreign_bulk_buy: "외국인 대량 매수",
  institution_bulk_buy: "기관 대량 매수",
}

const SEVERITY_DOT: Record<string, string> = {
  info: "bg-blue-400",
  warning: "bg-amber-400",
  critical: "bg-red-500",
}

interface NotificationDrawerProps {
  readonly isOpen: boolean
  readonly onClose: () => void
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return "방금"
  if (diffMin < 60) return `${diffMin}분 전`

  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}시간 전`

  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 7) return `${diffDay}일 전`

  return date.toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  })
}

export function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  const notifications = useNotificationStore((s) => s.notifications)
  const filter = useNotificationStore((s) => s.filter)
  const setFilter = useNotificationStore((s) => s.setFilter)
  const markAsRead = useNotificationStore((s) => s.markAsRead)
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead)
  const removeNotification = useNotificationStore((s) => s.removeNotification)
  const getFiltered = useNotificationStore((s) => s.getFilteredNotifications)

  const filtered = getFiltered()
  const hasUnread = notifications.some((n) => !n.read)

  const handleMarkRead = useCallback(
    (id: string) => {
      markAsRead(id)
    },
    [markAsRead]
  )

  const handleRemove = useCallback(
    (id: string) => {
      removeNotification(id)
    },
    [removeNotification]
  )

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={
          "fixed right-0 top-0 z-50 h-full w-96 max-w-full " +
          "bg-white shadow-xl transition-transform " +
          "border-l border-[var(--color-border-default)]"
        }
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] px-4 py-3">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
            알림
          </h2>
          <div className="flex items-center gap-2">
            {hasUnread && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[10px] font-medium text-[var(--color-accent-500)] hover:text-[var(--color-accent-400)]"
              >
                모두 읽음
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-100)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="border-b border-[var(--color-border-subtle)] px-4 py-2">
          <div className="flex gap-2">
            <select
              value={filter.type}
              onChange={(e) => setFilter({ type: e.target.value as NotificationType | "all" })}
              className={
                "rounded-lg px-2 py-1 text-[10px] outline-none " +
                "bg-[var(--color-surface-100)] text-[var(--color-text-secondary)] " +
                "ring-1 ring-[var(--color-border-default)]"
              }
            >
              <option value="all">전체</option>
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            <label className="flex items-center gap-1 text-[10px] text-[var(--color-text-tertiary)]">
              <input
                type="checkbox"
                checked={filter.onlyUnread}
                onChange={(e) => setFilter({ onlyUnread: e.target.checked })}
                className="rounded"
              />
              안읽음
            </label>
          </div>
        </div>

        {/* Notification list */}
        <div className="flex-1 overflow-y-auto" style={{ height: "calc(100vh - 110px)" }}>
          {filtered.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-[var(--color-text-tertiary)]">
              알림이 없습니다
            </p>
          ) : (
            <div className="divide-y divide-[var(--color-border-subtle)]">
              {filtered.map((n) => {
                const dot = SEVERITY_DOT[n.severity] ?? "bg-gray-400"

                return (
                  <div
                    key={n.id}
                    onClick={() => handleMarkRead(n.id)}
                    className={
                      "flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors " +
                      "hover:bg-[var(--color-surface-50)] " +
                      (n.read ? "" : "bg-[var(--color-surface-50)]/50")
                    }
                  >
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-[var(--color-text-primary)]">
                        {n.message}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        {n.ticker && (
                          <span className="font-mono text-[10px] text-[var(--color-text-tertiary)]">
                            {n.ticker}
                          </span>
                        )}
                        <span className="text-[10px] text-[var(--color-text-muted)]">
                          {formatRelativeTime(n.date)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {!n.read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent-400)]" />
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemove(n.id)
                        }}
                        className="rounded p-0.5 text-[var(--color-text-muted)] hover:text-red-500"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
