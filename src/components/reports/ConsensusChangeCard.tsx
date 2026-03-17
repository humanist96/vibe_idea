"use client"

import { ArrowRight, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { formatCurrency } from "@/lib/utils/format"
import type { ConsensusChange } from "@/lib/report/weekly-types"

interface ConsensusChangeCardProps {
  readonly change: ConsensusChange
}

export function ConsensusChangeCard({ change }: ConsensusChangeCardProps) {
  const hasTargetPriceChange =
    change.targetPriceBefore != null && change.targetPriceAfter != null

  const isUp = (change.targetPriceChange ?? 0) > 0
  const isDown = (change.targetPriceChange ?? 0) < 0

  const changeColor = isUp
    ? "text-green-600"
    : isDown
      ? "text-red-600"
      : "text-[var(--color-text-muted)]"

  const bgColor = isUp
    ? "bg-green-50 border-green-200"
    : isDown
      ? "bg-red-50 border-red-200"
      : "bg-[var(--color-surface-50)] border-[var(--color-border-subtle)]"

  return (
    <div className={`rounded-lg border p-3 ${bgColor}`}>
      <div className="flex items-center gap-2 mb-2">
        {isUp ? (
          <TrendingUp className="h-3.5 w-3.5 text-green-600" />
        ) : isDown ? (
          <TrendingDown className="h-3.5 w-3.5 text-red-600" />
        ) : (
          <Minus className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
        )}
        <span className="text-xs font-bold text-[var(--color-text-primary)]">
          컨센서스 변화
        </span>
        {change.opinionChange && (
          <span className={`text-[10px] font-medium ${changeColor}`}>
            의견 {change.opinionChange}
          </span>
        )}
      </div>

      {hasTargetPriceChange && (
        <div className="flex items-center gap-2">
          <div className="text-center">
            <p className="text-[10px] text-[var(--color-text-muted)]">이전 목표가</p>
            <p className="text-xs font-semibold tabular-nums text-[var(--color-text-primary)]">
              {formatCurrency(change.targetPriceBefore!)}
            </p>
          </div>
          <ArrowRight className={`h-4 w-4 shrink-0 ${changeColor}`} />
          <div className="text-center">
            <p className="text-[10px] text-[var(--color-text-muted)]">현재 목표가</p>
            <p className="text-xs font-semibold tabular-nums text-[var(--color-text-primary)]">
              {formatCurrency(change.targetPriceAfter!)}
            </p>
          </div>
          {change.targetPriceChange != null && (
            <span className={`ml-auto text-sm font-bold tabular-nums ${changeColor}`}>
              {change.targetPriceChange > 0 ? "+" : ""}
              {change.targetPriceChange.toFixed(1)}%
            </span>
          )}
        </div>
      )}
    </div>
  )
}
