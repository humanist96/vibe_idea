"use client"

import { useMemo } from "react"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts"
import type { PortfolioItemLive } from "@/lib/portfolio/types"

interface AssetAllocationChartProps {
  readonly items: readonly PortfolioItemLive[]
  readonly mode: "sector" | "market"
}

const COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#0088fe",
  "#00c49f",
  "#ffbb28",
  "#ff8042",
  "#a4de6c",
  "#d0ed57",
]

export function AssetAllocationChart({
  items,
  mode,
}: AssetAllocationChartProps) {
  const data = useMemo(() => {
    const grouped = new Map<string, number>()
    for (const item of items) {
      const key = mode === "sector" ? item.sectorKr || "기타" : item.market
      const value = item.quantity * item.currentPrice
      grouped.set(key, (grouped.get(key) ?? 0) + value)
    }

    const total = Array.from(grouped.values()).reduce((s, v) => s + v, 0)

    return Array.from(grouped.entries())
      .map(([name, value]) => ({
        name,
        value: Math.round(value),
        percentage: total > 0 ? Math.round((value / total) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.value - a.value)
  }, [items, mode])

  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-[var(--color-text-tertiary)]">
        포트폴리오 데이터가 없습니다
      </p>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
        >
          {data.map((_, idx) => (
            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          formatter={(value: number) => [
            `${value.toLocaleString()}원`,
            "평가금",
          ]}
        />
        <Legend
          formatter={(value: string) => (
            <span className="text-xs text-[var(--color-text-secondary)]">
              {value}
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
