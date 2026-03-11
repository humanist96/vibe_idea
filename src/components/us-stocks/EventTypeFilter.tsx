"use client"

import { Button } from "@/components/ui/Button"

type USEventTypeFilter = "ALL" | "EARNINGS" | "IPO"
type PeriodDays = 7 | 30 | 90

interface EventTypeFilterProps {
  readonly period: PeriodDays
  readonly eventType: USEventTypeFilter
  readonly onPeriodChange: (days: PeriodDays) => void
  readonly onEventTypeChange: (type: USEventTypeFilter) => void
  readonly counts?: Readonly<Record<string, number>>
}

const PERIOD_OPTIONS: readonly {
  readonly label: string
  readonly days: PeriodDays
}[] = [
  { label: "7일", days: 7 },
  { label: "30일", days: 30 },
  { label: "90일", days: 90 },
]

const TYPE_OPTIONS: readonly {
  readonly label: string
  readonly value: USEventTypeFilter
}[] = [
  { label: "전체", value: "ALL" },
  { label: "실적 발표", value: "EARNINGS" },
  { label: "IPO", value: "IPO" },
]

export function EventTypeFilter({
  period,
  eventType,
  onPeriodChange,
  onEventTypeChange,
  counts,
}: EventTypeFilterProps) {
  return (
    <div className="space-y-3">
      {/* Period selector */}
      <div className="flex gap-1 rounded-lg bg-[var(--color-surface-50)] p-1">
        {PERIOD_OPTIONS.map((opt) => (
          <Button
            key={opt.days}
            variant={period === opt.days ? "primary" : "ghost"}
            size="sm"
            onClick={() => onPeriodChange(opt.days)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {/* Type filter */}
      <div className="flex flex-wrap gap-2">
        {TYPE_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            variant={eventType === opt.value ? "primary" : "ghost"}
            size="sm"
            onClick={() => onEventTypeChange(opt.value)}
          >
            {opt.label}
            {opt.value !== "ALL" && counts?.[opt.value] ? (
              <span className="ml-1 text-[10px] opacity-60">
                {counts[opt.value]}
              </span>
            ) : null}
          </Button>
        ))}
      </div>
    </div>
  )
}
