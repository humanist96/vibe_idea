"use client"

import { useNotificationStore } from "@/store/notifications"
import { Bell, TrendingUp, TrendingDown, BarChart3, Radio } from "lucide-react"

const ICON_MAP = {
  price_surge: TrendingUp,
  price_drop: TrendingDown,
  earnings_alert: BarChart3,
  market_alert: Radio,
} as const

const COLOR_MAP = {
  price_surge: "text-red-500 bg-red-50",
  price_drop: "text-blue-500 bg-blue-50",
  earnings_alert: "text-amber-500 bg-amber-50",
  market_alert: "text-purple-500 bg-purple-50",
} as const

export function RecentAlertsCard() {
  const notifications = useNotificationStore((s) => s.notifications)
  const recent = notifications.slice(0, 5)

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-card)] p-6">
      <div className="mb-3 flex items-center gap-2">
        <Bell className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-bold text-[var(--color-text-primary)]">최근 알림</h3>
      </div>

      {recent.length === 0 ? (
        <p className="text-xs text-[var(--color-text-muted)]">알림이 없습니다.</p>
      ) : (
        <div className="space-y-2">
          {recent.map((n) => {
            const Icon = ICON_MAP[n.type] || Bell
            const colorClass = COLOR_MAP[n.type] || "text-gray-500 bg-gray-50"

            return (
              <div
                key={n.id}
                className="flex items-start gap-2.5 rounded-lg px-2 py-1.5"
              >
                <div className={`mt-0.5 rounded-lg p-1.5 ${colorClass}`}>
                  <Icon className="h-3 w-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[var(--color-text-primary)] line-clamp-2">
                    {n.message}
                  </p>
                  <p className="mt-0.5 text-[10px] text-[var(--color-text-muted)]">
                    {n.stockName} · {n.date}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
