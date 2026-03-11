"use client"

import { Crosshair, CheckCircle2 } from "lucide-react"
import type { ActionItem } from "@/lib/report/types"

interface ActionItemCardProps {
  readonly actionItem: ActionItem
  readonly stockName: string
}

const ACTION_STYLES: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  "매수 고려": { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", icon: "text-green-500" },
  "비중 확대": { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: "text-emerald-500" },
  "관망": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: "text-amber-500" },
  "비중 축소": { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", icon: "text-orange-500" },
  "매도 고려": { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", icon: "text-red-500" },
}

export function ActionItemCard({ actionItem, stockName }: ActionItemCardProps) {
  const style = ACTION_STYLES[actionItem.action] ?? ACTION_STYLES["관망"]

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Crosshair className="h-3.5 w-3.5 text-violet-500" />
        <h4 className="text-xs font-bold text-[var(--color-text-primary)]">핵심 액션 아이템</h4>
      </div>

      <div className={`rounded-lg border ${style.border} ${style.bg} p-3`}>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold ${style.text} ${style.bg} ring-1 ring-inset ring-current/20`}>
            {actionItem.action}
          </span>
        </div>
        <p className={`mt-1.5 text-xs ${style.text}`}>
          {actionItem.reason}
        </p>

        {actionItem.conditions.length > 0 && (
          <div className="mt-2 space-y-1">
            {actionItem.conditions.map((condition, i) => (
              <div key={i} className="flex items-start gap-1.5 text-[11px] text-[var(--color-text-secondary)]">
                <CheckCircle2 className={`mt-0.5 h-3 w-3 shrink-0 ${style.icon}`} />
                <span>{condition}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
