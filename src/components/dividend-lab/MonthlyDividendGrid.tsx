"use client"

import type { MonthlyScheduleEntry } from "@/lib/dividend/dividend-types"
import { formatWonShort } from "@/lib/dividend/format-won"

interface MonthlyDividendGridProps {
  readonly schedule: readonly MonthlyScheduleEntry[]
}

const MONTH_LABELS = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월",
]

export function MonthlyDividendGrid({ schedule }: MonthlyDividendGridProps) {
  const maxAmount = Math.max(...schedule.map((s) => s.totalAmount), 1)

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
      {MONTH_LABELS.map((label, idx) => {
        const entry = schedule.find((s) => s.month === idx + 1)
        const amount = entry?.totalAmount ?? 0
        const isGap = amount === 0
        const barHeight = amount > 0 ? Math.max((amount / maxAmount) * 100, 8) : 0

        return (
          <div
            key={label}
            className={
              "flex flex-col items-center rounded-lg px-2 py-3 ring-1 transition-colors " +
              (isGap
                ? "bg-red-500/5 ring-red-500/20"
                : "bg-[var(--color-glass-1)] ring-[var(--color-border-subtle)]")
            }
          >
            <span className="text-[10px] font-medium text-[var(--color-text-tertiary)]">
              {label}
            </span>

            <div className="relative mt-2 flex h-16 w-full items-end justify-center">
              {amount > 0 ? (
                <div
                  className="w-6 rounded-t bg-blue-500/60"
                  style={{ height: `${barHeight}%` }}
                />
              ) : (
                <span className="text-[10px] text-red-400/60">GAP</span>
              )}
            </div>

            <span
              className={
                "mt-1.5 text-xs font-medium tabular-nums " +
                (isGap ? "text-red-400/60" : "text-[var(--color-text-secondary)]")
              }
            >
              {amount > 0 ? formatWonShort(amount) : "—"}
            </span>

            {entry && entry.stocks.length > 0 && (
              <div className="mt-1 flex flex-wrap justify-center gap-0.5">
                {entry.stocks.map((s) => (
                  <span
                    key={s.ticker}
                    className="rounded bg-[var(--color-glass-2)] px-1 py-0.5 text-[8px] text-[var(--color-text-muted)]"
                    title={`${s.name}: ${formatWonShort(s.amount)}`}
                  >
                    {s.ticker}
                  </span>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

