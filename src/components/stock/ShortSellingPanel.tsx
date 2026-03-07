"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from "recharts"

interface ShortSellingEntry {
  readonly date: string
  readonly close: number
  readonly shortVolume: number
  readonly shortAmount: number
  readonly shortRatio: number
}

interface ShortSellingPanelProps {
  readonly ticker: string
}

function formatVolume(v: number): string {
  const abs = Math.abs(v)
  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${(v / 1_000).toFixed(0)}K`
  return v.toLocaleString("ko-KR")
}

export function ShortSellingPanel({ ticker }: ShortSellingPanelProps) {
  const [entries, setEntries] = useState<ShortSellingEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/stocks/${ticker}/short-selling`)
        const json = await res.json()
        if (json.success) {
          setEntries(json.data.entries ?? [])
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [ticker])

  if (loading) {
    return <LoadingSkeleton className="h-64 w-full rounded-xl" />
  }

  if (entries.length === 0) return null

  const chartData = [...entries]
    .reverse()
    .slice(-20)
    .map((e) => ({
      date: e.date.slice(5),
      공매도량: e.shortVolume,
      비율: e.shortRatio,
    }))

  const latest = entries[0]
  const avgRatio =
    entries.slice(0, 5).reduce((sum, e) => sum + e.shortRatio, 0) /
    Math.min(entries.length, 5)

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <TrendingDown className="h-3.5 w-3.5 text-[var(--color-accent-500)]" />
            공매도 현황
          </span>
        </CardTitle>
      </CardHeader>

      {latest && (
        <div className="mb-4 grid grid-cols-3 gap-3 px-5">
          <div className="glass-card rounded-lg p-3">
            <p className="text-[10px] font-semibold uppercase text-[var(--color-text-muted)]">
              공매도 비율
            </p>
            <p
              className={cn(
                "mt-1 text-lg font-bold tabular-nums",
                latest.shortRatio > 5
                  ? "text-[var(--color-gain)]"
                  : "text-[var(--color-text-primary)]"
              )}
            >
              {latest.shortRatio.toFixed(2)}%
            </p>
          </div>
          <div className="glass-card rounded-lg p-3">
            <p className="text-[10px] font-semibold uppercase text-[var(--color-text-muted)]">
              공매도량
            </p>
            <p className="mt-1 text-lg font-bold tabular-nums text-[var(--color-text-primary)]">
              {formatVolume(latest.shortVolume)}
            </p>
          </div>
          <div className="glass-card rounded-lg p-3">
            <p className="text-[10px] font-semibold uppercase text-[var(--color-text-muted)]">
              5일 평균 비율
            </p>
            <p
              className={cn(
                "mt-1 text-lg font-bold tabular-nums",
                avgRatio > 5
                  ? "text-[var(--color-gain)]"
                  : "text-[var(--color-text-primary)]"
              )}
            >
              {avgRatio.toFixed(2)}%
            </p>
          </div>
        </div>
      )}

      <div className="h-52 px-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="volume"
              orientation="left"
              tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatVolume(v)}
              width={55}
            />
            <YAxis
              yAxisId="ratio"
              orientation="right"
              tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
              width={40}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-midnight-800)",
                border: "1px solid var(--color-border-subtle)",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value: number, name: string) => [
                name === "비율" ? `${value.toFixed(2)}%` : formatVolume(value),
                name,
              ]}
            />
            <Bar
              yAxisId="volume"
              dataKey="공매도량"
              fill="var(--color-gain)"
              opacity={0.3}
              radius={[2, 2, 0, 0]}
            />
            <Line
              yAxisId="ratio"
              type="monotone"
              dataKey="비율"
              stroke="var(--color-gain)"
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
