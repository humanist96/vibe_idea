"use client"

import { useId } from "react"
import { cn } from "@/lib/utils/cn"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface IndicatorCardProps {
  readonly name: string
  readonly value: number
  readonly change: number
  readonly changePercent: number
  readonly unit: string
  readonly date: string
  readonly history: readonly { readonly date: string; readonly value: number }[]
}

function formatValue(value: number, unit: string): string {
  if (unit === "%") return `${value.toFixed(2)}%`
  if (unit === "지수") return value.toFixed(1)
  if (unit === "원") return value.toLocaleString("ko-KR", { maximumFractionDigits: 1 })
  if (unit === "십억원") return `${(value / 1000).toFixed(0)}조`
  if (unit.includes("$")) return `$${value.toFixed(2)}`
  return value.toFixed(2)
}

function formatTickDate(dateStr: string): string {
  if (!dateStr) return ""
  // "2024-01" or "2024-01-15" → "24.01"
  const parts = dateStr.split("-")
  if (parts.length >= 2) {
    return `${parts[0].slice(2)}.${parts[1]}`
  }
  return dateStr.slice(2)
}

export function IndicatorCard({
  name,
  value,
  change,
  changePercent,
  unit,
  date,
  history,
}: IndicatorCardProps) {
  const gradientId = useId()
  const isUp = change > 0
  const isDown = change < 0

  return (
    <div className="glass-card rounded-xl p-4 transition-all duration-200 hover:bg-[var(--color-surface-100)]">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-[var(--color-text-tertiary)]">
            {name}
          </p>
          <p className="mt-1 text-xl font-bold tabular-nums text-[var(--color-text-primary)]">
            {formatValue(value, unit)}
          </p>
        </div>
        <div
          className={cn(
            "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
            isUp && "bg-[var(--color-gain)]/10 text-[var(--color-gain)]",
            isDown && "bg-[var(--color-loss)]/10 text-[var(--color-loss)]",
            !isUp && !isDown && "bg-[var(--color-glass-2)] text-[var(--color-text-tertiary)]"
          )}
        >
          {isUp ? (
            <TrendingUp className="h-3 w-3" />
          ) : isDown ? (
            <TrendingDown className="h-3 w-3" />
          ) : (
            <Minus className="h-3 w-3" />
          )}
          <span className="tabular-nums">
            {changePercent > 0 ? "+" : ""}
            {changePercent.toFixed(2)}%
          </span>
        </div>
      </div>

      {history.length > 2 && (
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={[...history]} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tickFormatter={formatTickDate}
                tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={40}
              />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
                axisLine={false}
                tickLine={false}
                tickCount={4}
                tickFormatter={(v: number) =>
                  unit === "%" ? `${v.toFixed(1)}` : v.toLocaleString()
                }
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-surface-200)",
                  border: "1px solid var(--color-border-subtle)",
                  borderRadius: "8px",
                  fontSize: "11px",
                  color: "var(--color-text-primary)",
                }}
                labelFormatter={(label: string) => label}
                formatter={(v: number) => [formatValue(v, unit), name]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#f59e0b"
                strokeWidth={1.5}
                fill={`url(#${gradientId})`}
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <p className="mt-2 text-[10px] text-[var(--color-text-muted)]">{date}</p>
    </div>
  )
}
