"use client"

import { useCallback, useState } from "react"
import { Trash2 } from "lucide-react"

const ALERT_TYPE_LABELS: Record<string, string> = {
  PRICE_ABOVE: "목표가 이상",
  PRICE_BELOW: "하한가 이하",
  VOLUME_SPIKE: "거래량 급증",
  EARNINGS_DATE: "실적 발표일",
}

interface AlertRule {
  readonly id: string
  readonly ticker: string
  readonly market: string
  readonly type: string
  readonly threshold: number | null
  readonly active: boolean
  readonly createdAt: string
}

interface AlertRuleCardProps {
  readonly rule: AlertRule
  readonly onToggle: (id: string, active: boolean) => void
  readonly onDelete: (id: string) => void
}

function formatThreshold(threshold: number | null, market: string, type: string): string {
  if (threshold === null) return ""
  if (type === "VOLUME_SPIKE") return `${threshold}x`
  if (market === "US") {
    return `$${threshold.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
  }
  return `${threshold.toLocaleString("ko-KR")}원`
}

export function AlertRuleCard({ rule, onToggle, onDelete }: AlertRuleCardProps) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = useCallback(async () => {
    setDeleting(true)
    onDelete(rule.id)
  }, [rule.id, onDelete])

  const thresholdText = formatThreshold(rule.threshold, rule.market, rule.type)
  const typeLabel = ALERT_TYPE_LABELS[rule.type] ?? rule.type

  return (
    <div
      className={
        "flex items-center gap-3 rounded-xl px-4 py-3 transition-colors " +
        "border border-[var(--color-border-default)] bg-white " +
        (rule.active ? "" : "opacity-50")
      }
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold text-[var(--color-text-primary)]">
            {rule.ticker}
          </span>
          <span
            className={
              "rounded px-1.5 py-0.5 text-[10px] font-medium " +
              (rule.market === "US"
                ? "bg-blue-50 text-blue-600"
                : "bg-emerald-50 text-emerald-600")
            }
          >
            {rule.market}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
          {typeLabel}
          {thresholdText && ` · ${thresholdText}`}
        </p>
      </div>

      <label className="relative inline-flex cursor-pointer items-center">
        <input
          type="checkbox"
          checked={rule.active}
          onChange={() => onToggle(rule.id, !rule.active)}
          className="peer sr-only"
        />
        <div
          className={
            "h-5 w-9 rounded-full transition-colors " +
            "bg-[var(--color-surface-200)] " +
            "peer-checked:bg-[var(--color-accent-500)] " +
            "after:absolute after:left-[2px] after:top-[2px] " +
            "after:h-4 after:w-4 after:rounded-full after:bg-white " +
            "after:transition-transform after:content-[''] " +
            "peer-checked:after:translate-x-full"
          }
        />
      </label>

      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className={
          "rounded-lg p-1.5 transition-colors " +
          "text-[var(--color-text-tertiary)] hover:bg-red-50 hover:text-red-500 " +
          "disabled:opacity-50"
        }
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}
