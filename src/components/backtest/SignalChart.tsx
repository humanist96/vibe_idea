"use client"

import { useMemo } from "react"
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Scatter,
} from "recharts"
import type { BacktestResult } from "@/lib/backtest/types"

interface SignalChartProps {
  readonly result: BacktestResult
}

interface ChartPoint {
  readonly date: string
  readonly price: number
  readonly equity: number
  readonly buySignal?: number
  readonly sellSignal?: number
}

export function SignalChart({ result }: SignalChartProps) {
  const data = useMemo(() => {
    const buyDates = new Set(
      result.trades
        .filter((t) => t.type === "BUY")
        .map((t) => t.date)
    )
    const sellDates = new Set(
      result.trades
        .filter((t) => t.type === "SELL")
        .map((t) => t.date)
    )

    const step = Math.max(1, Math.floor(result.equityCurve.length / 300))

    return result.equityCurve
      .filter((_, i) => i % step === 0 || i === result.equityCurve.length - 1)
      .map((point): ChartPoint => {
        const isBuy = buyDates.has(point.date)
        const isSell = sellDates.has(point.date)
        return {
          date: point.date,
          price: point.price,
          equity: point.value,
          ...(isBuy ? { buySignal: point.price } : {}),
          ...(isSell ? { sellSignal: point.price } : {}),
        }
      })
  }, [result])

  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-[var(--color-text-tertiary)]">
        차트 데이터가 없습니다
      </p>
    )
  }

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
      <h3 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">
        매매 시그널 차트
      </h3>
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "var(--color-text-tertiary)" }}
            tickFormatter={(v: string) => v.slice(5)}
            interval="preserveStartEnd"
          />
          <YAxis
            yAxisId="price"
            orientation="left"
            tick={{ fontSize: 10, fill: "var(--color-text-tertiary)" }}
            tickFormatter={(v: number) => v.toLocaleString()}
          />
          <YAxis
            yAxisId="equity"
            orientation="right"
            tick={{ fontSize: 10, fill: "var(--color-text-tertiary)" }}
            tickFormatter={(v: number) =>
              `${(v / 10000).toFixed(0)}만`
            }
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--color-bg-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value: number, name: string) => {
              const labels: Record<string, string> = {
                price: "주가",
                equity: "자산",
                buySignal: "매수",
                sellSignal: "매도",
              }
              return [value.toLocaleString(), labels[name] ?? name]
            }}
          />
          <Area
            yAxisId="equity"
            type="monotone"
            dataKey="equity"
            fill="var(--color-brand)"
            fillOpacity={0.1}
            stroke="var(--color-brand)"
            strokeWidth={1}
            dot={false}
          />
          <Line
            yAxisId="price"
            type="monotone"
            dataKey="price"
            stroke="var(--color-text-secondary)"
            strokeWidth={1.5}
            dot={false}
          />
          <Scatter
            yAxisId="price"
            dataKey="buySignal"
            fill="#ef4444"
            shape="triangle"
          />
          <Scatter
            yAxisId="price"
            dataKey="sellSignal"
            fill="#3b82f6"
            shape="diamond"
          />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="mt-2 flex items-center justify-center gap-4 text-xs text-[var(--color-text-tertiary)]">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
          매수
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
          매도
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded border border-[var(--color-text-secondary)]" />
          주가
        </span>
        <span className="flex items-center gap-1">
          <span
            className="inline-block h-3 w-3 rounded"
            style={{ backgroundColor: "var(--color-brand)", opacity: 0.5 }}
          />
          자산
        </span>
      </div>
    </div>
  )
}
