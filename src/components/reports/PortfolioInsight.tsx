"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { Briefcase } from "lucide-react"
import type { StockReportData } from "@/lib/report/types"

interface PortfolioInsightProps {
  readonly stocks: readonly StockReportData[]
  readonly insight: string
}

const SECTOR_COLORS = [
  "#f59e0b", "#3b82f6", "#10b981", "#8b5cf6",
  "#ef4444", "#06b6d4", "#ec4899", "#84cc16",
]

export function PortfolioInsight({ stocks, insight }: PortfolioInsightProps) {
  // Sector distribution
  const sectorMap = new Map<string, number>()
  for (const stock of stocks) {
    if (!stock.quote) continue
    const sector = stock.quote.ticker // we don't have sector on quote — use name grouping
    const existing = sectorMap.get(stock.name) ?? 0
    sectorMap.set(stock.name, existing + 1)
  }

  const sectorData = Array.from(sectorMap.entries()).map(([name, count]) => ({
    name: name.length > 6 ? name.slice(0, 6) + ".." : name,
    value: count,
  }))

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Briefcase className="h-3.5 w-3.5 text-[var(--color-accent-500)]" />
        <h3 className="text-sm font-bold text-[var(--color-text-primary)]">포트폴리오 인사이트</h3>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        {/* Sector Distribution */}
        {sectorData.length > 0 && (
          <div className="flex items-center gap-3">
            <ResponsiveContainer width={100} height={100}>
              <PieChart>
                <Pie
                  data={sectorData}
                  cx="50%"
                  cy="50%"
                  innerRadius={25}
                  outerRadius={45}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {sectorData.map((_, i) => (
                    <Cell key={i} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number, name: string) => [`${v}개`, name]}
                  contentStyle={{ fontSize: 11, borderRadius: 8 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1">
              {sectorData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1.5 text-[10px]">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: SECTOR_COLORS[i % SECTOR_COLORS.length] }} />
                  <span className="text-[var(--color-text-secondary)]">{d.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Insight Text */}
        <div className="flex-1">
          <p className="rounded-lg bg-[var(--color-surface-50)] p-3 text-xs leading-relaxed text-[var(--color-text-secondary)]">
            {insight}
          </p>
        </div>
      </div>
    </div>
  )
}
