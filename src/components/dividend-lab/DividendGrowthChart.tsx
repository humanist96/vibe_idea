"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { useMemo } from "react"
import type { YearlyProjectionEntry } from "@/lib/dividend/dividend-types"
import { formatWon, formatWonAxis } from "@/lib/dividend/format-won"

interface DividendGrowthChartProps {
  readonly projection: readonly YearlyProjectionEntry[]
}

export function DividendGrowthChart({ projection }: DividendGrowthChartProps) {
  const data = useMemo(() =>
    projection.map((p) => ({
      year: `${p.year}년`,
      drip: Math.round(p.cumulativeDividend),
      simple: Math.round(p.cumulativeDividendSimple),
      dripAdd: Math.round(p.cumulativeDividendWithAdd),
    })),
    [projection],
  )

  const hasAddition = useMemo(
    () => projection.some((p) => p.cumulativeDividendWithAdd !== p.cumulativeDividend),
    [projection],
  )

  if (projection.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-xs text-[var(--color-text-muted)]">
        시뮬레이션 데이터 없음
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
        <XAxis
          dataKey="year"
          tick={{ fill: "var(--color-text-muted)", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "var(--color-text-muted)", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={formatWonAxis}
          width={52}
        />
        <Tooltip
          contentStyle={{
            background: "var(--color-glass-3)",
            border: "1px solid var(--color-border-subtle)",
            borderRadius: 8,
            fontSize: 11,
          }}
          formatter={(value: number, name: string) => [
            formatWon(value),
            name === "drip" ? "DRIP" : name === "simple" ? "단순 보유" : "DRIP+적립",
          ]}
        />
        <Legend
          wrapperStyle={{ fontSize: 11 }}
          formatter={(value) =>
            value === "drip" ? "DRIP" : value === "simple" ? "단순 보유" : "DRIP+적립"
          }
        />
        <Line
          type="monotone"
          dataKey="simple"
          stroke="#94a3b8"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="drip"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={false}
        />
        {hasAddition && (
          <Line
            type="monotone"
            dataKey="dripAdd"
            stroke="#a78bfa"
            strokeWidth={2}
            dot={false}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  )
}

