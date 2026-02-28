"use client"

import { cn } from "@/lib/utils/cn"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import {
  AreaChart,
  Area,
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

export function IndicatorCard({
  name,
  value,
  change,
  changePercent,
  unit,
  date,
  history,
}: IndicatorCardProps) {
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
        <div className="h-12">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={[...history]}>
              <defs>
                <linearGradient id={`grad-${name}`} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={isDown ? "var(--color-loss)" : "var(--color-accent-400)"}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="100%"
                    stopColor={isDown ? "var(--color-loss)" : "var(--color-accent-400)"}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={isDown ? "var(--color-loss)" : "var(--color-accent-400)"}
                strokeWidth={1.5}
                fill={`url(#grad-${name})`}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <p className="mt-2 text-[10px] text-[var(--color-text-muted)]">{date}</p>
    </div>
  )
}
