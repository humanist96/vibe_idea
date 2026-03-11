"use client"

import { ShieldAlert, AlertTriangle, Info } from "lucide-react"
import type { RiskAlert, RiskAlertLevel } from "@/lib/report/types"

interface RiskAlertBadgesProps {
  readonly alerts: readonly RiskAlert[]
}

const LEVEL_STYLES: Record<RiskAlertLevel, { bg: string; text: string; border: string }> = {
  critical: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  warning: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  info: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
}

const LEVEL_ICONS: Record<RiskAlertLevel, typeof ShieldAlert> = {
  critical: ShieldAlert,
  warning: AlertTriangle,
  info: Info,
}

export function RiskAlertBadges({ alerts }: RiskAlertBadgesProps) {
  if (alerts.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5">
      {alerts.map((alert, i) => {
        const style = LEVEL_STYLES[alert.level]
        const Icon = LEVEL_ICONS[alert.level]
        return (
          <div
            key={i}
            tabIndex={0}
            role="status"
            aria-label={`${alert.label}: ${alert.detail}`}
            className={`group relative inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium cursor-default ${style.bg} ${style.text} ${style.border}`}
          >
            <Icon className="h-2.5 w-2.5" />
            <span>{alert.label}</span>
            {/* Tooltip */}
            <div className="invisible group-hover:visible group-focus-within:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-max max-w-48 rounded-md bg-[var(--color-surface-800)] px-2 py-1 text-[10px] text-white shadow-lg z-50">
              {alert.detail}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--color-surface-800)]" />
            </div>
          </div>
        )
      })}
    </div>
  )
}
