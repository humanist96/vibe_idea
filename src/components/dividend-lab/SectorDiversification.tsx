"use client"

import { useMemo } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import type { SectorAllocationEntry, DividendMarket } from "@/lib/dividend/dividend-types"

interface SectorDiversificationProps {
  readonly sectorAllocation: readonly SectorAllocationEntry[]
  readonly items: readonly { readonly market: DividendMarket }[]
}

const SECTOR_COLORS = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b",
  "#10b981", "#06b6d4", "#f97316", "#6366f1",
  "#14b8a6", "#e11d48", "#84cc16", "#a855f7",
]

export function SectorDiversification({
  sectorAllocation,
  items,
}: SectorDiversificationProps) {
  const pieData = useMemo(
    () =>
      sectorAllocation
        .filter((s) => s.weight > 0)
        .map((s, i) => ({
          name: s.sector,
          value: Math.round(s.weight * 10) / 10,
          count: s.count,
          color: SECTOR_COLORS[i % SECTOR_COLORS.length],
        })),
    [sectorAllocation],
  )

  const marketBreakdown = useMemo(() => {
    const kr = items.filter((i) => i.market === "KR").length
    const us = items.filter((i) => i.market === "US").length
    const total = kr + us
    return {
      kr,
      us,
      krPct: total > 0 ? Math.round((kr / total) * 100) : 0,
      usPct: total > 0 ? Math.round((us / total) * 100) : 0,
    }
  }, [items])

  const concentrationWarning = sectorAllocation.some((s) => s.weight > 40)

  if (sectorAllocation.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-xs text-[var(--color-text-muted)]">
        섹터 데이터 없음
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Donut chart */}
      <div className="flex items-center gap-4">
        <div className="h-36 w-36 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={60}
                dataKey="value"
                stroke="none"
              >
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "var(--color-glass-3)",
                  border: "1px solid var(--color-border-subtle)",
                  borderRadius: 8,
                  fontSize: 11,
                }}
                formatter={(value: number) => [`${value}%`, "비중"]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="min-w-0 flex-1 space-y-1">
          {pieData.map((entry) => (
            <div key={entry.name} className="flex items-center gap-2 text-xs">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: entry.color }}
              />
              <span className="min-w-0 truncate text-[var(--color-text-secondary)]">
                {entry.name}
              </span>
              <span className="ml-auto shrink-0 tabular-nums font-medium text-[var(--color-text-primary)]">
                {entry.value}%
              </span>
              <span className="shrink-0 text-[10px] text-[var(--color-text-muted)]">
                ({entry.count})
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* KR/US breakdown bar */}
      <div>
        <div className="mb-1.5 flex items-center justify-between text-[10px]">
          <span className="text-blue-400">국내 {marketBreakdown.krPct}%</span>
          <span className="text-purple-400">해외 {marketBreakdown.usPct}%</span>
        </div>
        <div className="flex h-2 overflow-hidden rounded-full bg-[var(--color-glass-2)]">
          {marketBreakdown.krPct > 0 && (
            <div
              className="bg-blue-500/60 transition-all duration-300"
              style={{ width: `${marketBreakdown.krPct}%` }}
            />
          )}
          {marketBreakdown.usPct > 0 && (
            <div
              className="bg-purple-500/60 transition-all duration-300"
              style={{ width: `${marketBreakdown.usPct}%` }}
            />
          )}
        </div>
      </div>

      {/* Concentration warning */}
      {concentrationWarning && (
        <div className="rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
          단일 섹터 비중 40% 초과 - 분산 투자를 권장합니다.
        </div>
      )}
    </div>
  )
}
