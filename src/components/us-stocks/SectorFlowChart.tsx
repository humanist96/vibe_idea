"use client"

import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { PieChart } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts"

interface SectorFlow {
  readonly sector: string
  readonly sectorKr: string
  readonly netChange: number
  readonly tickers: readonly string[]
}

interface SectorFlowChartProps {
  readonly sectorFlow: readonly SectorFlow[]
}

function formatShortNumber(v: number): string {
  const abs = Math.abs(v)
  if (abs >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`
  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${(v / 1_000).toFixed(0)}K`
  return v.toLocaleString()
}

export function SectorFlowChart({ sectorFlow }: SectorFlowChartProps) {
  if (sectorFlow.length === 0) {
    return null
  }

  const chartData = sectorFlow
    .filter((s) => s.netChange !== 0)
    .slice(0, 12)
    .map((s) => ({
      name: s.sectorKr,
      value: s.netChange,
      tickers: s.tickers.join(", "),
    }))

  if (chartData.length === 0) {
    return null
  }

  return (
    <Card className="animate-fade-up">
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <PieChart className="h-3.5 w-3.5 text-[var(--color-accent-500)]" />
            섹터별 기관 자금 흐름
          </span>
        </CardTitle>
      </CardHeader>
      <div className="h-72 px-2 pb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => formatShortNumber(v)}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }}
              axisLine={false}
              tickLine={false}
              width={80}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-midnight-800)",
                border: "1px solid var(--color-border-subtle)",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value: number, _name: string, props: { payload?: { tickers?: string } }) => [
                `${formatShortNumber(value)} 주`,
                props.payload?.tickers ?? "",
              ]}
            />
            <ReferenceLine x={0} stroke="var(--color-border-default)" />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={28}>
              {chartData.map((entry, idx) => (
                <Cell
                  key={idx}
                  fill={
                    entry.value >= 0
                      ? "var(--color-gain)"
                      : "var(--color-loss)"
                  }
                  fillOpacity={0.8}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
