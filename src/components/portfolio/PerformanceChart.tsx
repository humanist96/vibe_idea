"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

interface DataPoint {
  readonly date: string
  readonly portfolio: number
  readonly benchmark?: number
}

interface PerformanceChartProps {
  readonly data: readonly DataPoint[]
  readonly benchmarkName?: string
}

export function PerformanceChart({
  data,
  benchmarkName = "KOSPI",
}: PerformanceChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-[var(--color-text-tertiary)]">
          성과 데이터가 없습니다
        </p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data as DataPoint[]} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: "var(--color-text-tertiary)" }}
          tickFormatter={(v: string) => v.slice(5)}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "var(--color-text-tertiary)" }}
          tickFormatter={(v: number) => `${v.toFixed(1)}%`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          formatter={(value: number, name: string) => [
            `${value.toFixed(2)}%`,
            name === "portfolio" ? "내 포트폴리오" : benchmarkName,
          ]}
        />
        <Legend
          formatter={(value: string) =>
            value === "portfolio" ? "내 포트폴리오" : benchmarkName
          }
        />
        <Line
          type="monotone"
          dataKey="portfolio"
          stroke="var(--color-brand)"
          strokeWidth={2}
          dot={false}
        />
        {data.some((d) => d.benchmark !== undefined) && (
          <Line
            type="monotone"
            dataKey="benchmark"
            stroke="var(--color-text-tertiary)"
            strokeWidth={1.5}
            strokeDasharray="5 5"
            dot={false}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  )
}
