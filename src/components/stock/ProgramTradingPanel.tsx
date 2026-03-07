"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { Monitor } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"

interface ProgramTradingEntry {
  readonly date: string
  readonly close: number
  readonly programBuy: number
  readonly programSell: number
  readonly programNet: number
}

interface ProgramTradingPanelProps {
  readonly ticker: string
}

function formatVolume(v: number): string {
  const abs = Math.abs(v)
  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${(v / 1_000).toFixed(0)}K`
  return v.toLocaleString("ko-KR")
}

export function ProgramTradingPanel({ ticker }: ProgramTradingPanelProps) {
  const [entries, setEntries] = useState<ProgramTradingEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/stocks/${ticker}/program`)
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
      순매수: e.programNet,
    }))

  const latest = entries[0]
  const sum5d = entries.slice(0, 5).reduce((s, e) => s + e.programNet, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <Monitor className="h-3.5 w-3.5 text-[var(--color-accent-500)]" />
            프로그램 매매
          </span>
        </CardTitle>
      </CardHeader>

      {latest && (
        <div className="mb-4 grid grid-cols-3 gap-3 px-5">
          <div className="glass-card rounded-lg p-3">
            <p className="text-[10px] font-semibold uppercase text-[var(--color-text-muted)]">
              프로그램 순매수
            </p>
            <p
              className={cn(
                "mt-1 text-lg font-bold tabular-nums",
                latest.programNet > 0
                  ? "text-[var(--color-gain)]"
                  : latest.programNet < 0
                    ? "text-[var(--color-loss)]"
                    : "text-[var(--color-text-secondary)]"
              )}
            >
              {latest.programNet > 0 ? "+" : ""}
              {formatVolume(latest.programNet)}
            </p>
          </div>
          <div className="glass-card rounded-lg p-3">
            <p className="text-[10px] font-semibold uppercase text-[var(--color-text-muted)]">
              매수
            </p>
            <p className="mt-1 text-lg font-bold tabular-nums text-[var(--color-gain)]">
              {formatVolume(latest.programBuy)}
            </p>
          </div>
          <div className="glass-card rounded-lg p-3">
            <p className="text-[10px] font-semibold uppercase text-[var(--color-text-muted)]">
              5일 합산
            </p>
            <p
              className={cn(
                "mt-1 text-lg font-bold tabular-nums",
                sum5d > 0
                  ? "text-[var(--color-gain)]"
                  : sum5d < 0
                    ? "text-[var(--color-loss)]"
                    : "text-[var(--color-text-secondary)]"
              )}
            >
              {sum5d > 0 ? "+" : ""}
              {formatVolume(sum5d)}
            </p>
          </div>
        </div>
      )}

      <div className="h-52 px-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap="20%">
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatVolume(v)}
              width={55}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-midnight-800)",
                border: "1px solid var(--color-border-subtle)",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value: number) => [formatVolume(value), ""]}
            />
            <ReferenceLine y={0} stroke="var(--color-border-default)" />
            <Bar
              dataKey="순매수"
              fill="#8b5cf6"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
