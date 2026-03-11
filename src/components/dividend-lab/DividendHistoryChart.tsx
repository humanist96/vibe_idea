"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import type { DividendHistoryEntry } from "@/lib/dividend/dividend-types"

interface DividendHistoryChartProps {
  readonly history: readonly DividendHistoryEntry[]
  readonly currency: "KRW" | "USD"
}

export function DividendHistoryChart({
  history,
  currency,
}: DividendHistoryChartProps) {
  if (history.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-xs text-[var(--color-text-muted)]">
        배당 이력 없음
      </div>
    )
  }

  const data = history.map((h) => ({
    year: String(h.year),
    amount: h.amount,
    yield: h.yield,
  }))

  const formatAmount = (v: number) =>
    currency === "KRW" ? `${v.toLocaleString()}원` : `$${v.toFixed(2)}`

  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
        <XAxis
          dataKey="year"
          tick={{ fill: "var(--color-text-muted)", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis hide />
        <Tooltip
          contentStyle={{
            background: "var(--color-glass-3)",
            border: "1px solid var(--color-border-subtle)",
            borderRadius: 8,
            fontSize: 11,
          }}
          formatter={(value: number) => [formatAmount(value), "주당배당"]}
          labelFormatter={(label) => `${label}년`}
        />
        <Bar
          dataKey="amount"
          fill="var(--color-accent-blue, #3b82f6)"
          radius={[4, 4, 0, 0]}
          maxBarSize={32}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
