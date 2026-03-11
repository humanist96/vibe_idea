"use client"

import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import type { DividendSimulation } from "@/lib/dividend/dividend-types"
import { formatWon } from "@/lib/dividend/format-won"
import { GRADE_COLORS } from "./constants"

interface SimulationDashboardProps {
  readonly simulation: DividendSimulation | null
  readonly loading: boolean
}

export function SimulationDashboard({
  simulation,
  loading,
}: SimulationDashboardProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 animate-fade-up stagger-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <LoadingSkeleton className="mb-2 h-3 w-16" />
            <LoadingSkeleton className="h-7 w-24" />
          </Card>
        ))}
      </div>
    )
  }

  if (!simulation) return null

  const { summary } = simulation

  const cards = [
    {
      label: "가중 배당률",
      value: `${summary.weightedYield}%`,
      color: "text-amber-400",
    },
    {
      label: "연간 배당금",
      value: formatWon(summary.annualDividend),
      color: "text-emerald-400",
    },
    {
      label: "월평균 배당",
      value: formatWon(summary.monthlyDividend),
      color: "text-blue-400",
    },
    {
      label: "누적 배당 (DRIP)",
      value: formatWon(summary.totalWithDrip),
      color: "text-purple-400",
    },
    {
      label: "안전 등급",
      value: summary.safetyGrade,
      color: GRADE_COLORS[summary.safetyGrade] ?? "text-[var(--color-text-primary)]",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 animate-fade-up stagger-3">
      {cards.map((card) => (
        <Card key={card.label}>
          <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
            {card.label}
          </div>
          <div className={`mt-1 text-xl font-bold tabular-nums ${card.color}`}>
            {card.value}
          </div>
        </Card>
      ))}
    </div>
  )
}
