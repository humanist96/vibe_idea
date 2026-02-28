"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { ArrowLeftRight } from "lucide-react"
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
import type { InvestorFlowEntry } from "@/lib/api/naver-investor-types"

interface InvestorFlowPanelProps {
  readonly ticker: string
}

function formatVolume(v: number): string {
  const abs = Math.abs(v)
  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${(v / 1_000).toFixed(0)}K`
  return v.toLocaleString("ko-KR")
}

export function InvestorFlowPanel({ ticker }: InvestorFlowPanelProps) {
  const [entries, setEntries] = useState<InvestorFlowEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/stocks/${ticker}/investor`)
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
      외국인: e.foreignNet,
      기관: e.institutionNet,
    }))

  const latest = entries[0]

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <ArrowLeftRight className="h-3.5 w-3.5 text-[var(--color-accent-500)]" />
            외국인·기관 매매 동향
          </span>
        </CardTitle>
      </CardHeader>

      {latest && (
        <div className="mb-4 grid grid-cols-2 gap-4 px-5">
          <div className="glass-card rounded-lg p-3">
            <p className="text-[10px] font-semibold uppercase text-[var(--color-text-muted)]">
              외국인 순매매
            </p>
            <p
              className={cn(
                "mt-1 text-lg font-bold tabular-nums",
                latest.foreignNet > 0
                  ? "text-[var(--color-gain)]"
                  : latest.foreignNet < 0
                    ? "text-[var(--color-loss)]"
                    : "text-[var(--color-text-secondary)]"
              )}
            >
              {latest.foreignNet > 0 ? "+" : ""}
              {formatVolume(latest.foreignNet)}
            </p>
            <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
              보유율 {latest.foreignRatio.toFixed(2)}%
            </p>
          </div>
          <div className="glass-card rounded-lg p-3">
            <p className="text-[10px] font-semibold uppercase text-[var(--color-text-muted)]">
              기관 순매매
            </p>
            <p
              className={cn(
                "mt-1 text-lg font-bold tabular-nums",
                latest.institutionNet > 0
                  ? "text-[var(--color-gain)]"
                  : latest.institutionNet < 0
                    ? "text-[var(--color-loss)]"
                    : "text-[var(--color-text-secondary)]"
              )}
            >
              {latest.institutionNet > 0 ? "+" : ""}
              {formatVolume(latest.institutionNet)}
            </p>
          </div>
        </div>
      )}

      <div className="h-52 px-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barGap={0} barCategoryGap="20%">
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
            <Bar dataKey="외국인" fill="var(--color-accent-400)" radius={[2, 2, 0, 0]} />
            <Bar dataKey="기관" fill="#6366f1" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
