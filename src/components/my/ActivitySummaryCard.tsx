"use client"

import { useRecentlyViewedStore } from "@/store/recently-viewed"
import { useNotificationStore } from "@/store/notifications"
import { useScreenerPresetsStore } from "@/store/screener-presets"
import { usePortfolioStore } from "@/store/portfolio"
import { Eye, Bell, Filter, Briefcase } from "lucide-react"

export function ActivitySummaryCard() {
  const recentlyViewed = useRecentlyViewedStore((s) => s.stocks)
  const notifications = useNotificationStore((s) => s.notifications)
  const presets = useScreenerPresetsStore((s) => s.presets)
  const portfolio = usePortfolioStore((s) => s.items)

  const stats = [
    {
      label: "최근 본 종목",
      value: recentlyViewed.length,
      icon: Eye,
      color: "text-blue-500 bg-blue-50",
    },
    {
      label: "알림",
      value: notifications.length,
      icon: Bell,
      color: "text-amber-500 bg-amber-50",
    },
    {
      label: "프리셋",
      value: presets.length,
      icon: Filter,
      color: "text-purple-500 bg-purple-50",
    },
    {
      label: "포트폴리오",
      value: portfolio.length,
      icon: Briefcase,
      color: "text-green-500 bg-green-50",
    },
  ]

  return (
    <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4 sm:p-6">
      <h3 className="mb-4 text-sm font-bold text-[var(--color-text-primary)]">활동 요약</h3>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="rounded-xl bg-[var(--color-surface-50)] p-3 text-center"
            >
              <div className={`mx-auto mb-2 inline-flex rounded-lg p-2 ${stat.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="text-lg font-bold text-[var(--color-text-primary)]">
                {stat.value}
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">{stat.label}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
