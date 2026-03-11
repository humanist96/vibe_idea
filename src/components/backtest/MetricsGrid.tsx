"use client"

import type { BacktestResult } from "@/lib/backtest/types"

interface MetricsGridProps {
  readonly result: BacktestResult
}

function formatPct(value: number): string {
  const sign = value >= 0 ? "+" : ""
  return `${sign}${value.toFixed(2)}%`
}

function getColor(value: number): string {
  if (value > 0) return "var(--color-profit, #ef4444)"
  if (value < 0) return "var(--color-loss, #3b82f6)"
  return "var(--color-text-secondary)"
}

export function MetricsGrid({ result }: MetricsGridProps) {
  const metrics = [
    {
      label: "총 수익률",
      value: formatPct(result.totalReturn),
      color: getColor(result.totalReturn),
    },
    {
      label: "연평균 수익률 (CAGR)",
      value: formatPct(result.cagr),
      color: getColor(result.cagr),
    },
    {
      label: "최대 낙폭 (MDD)",
      value: `-${result.mdd.toFixed(2)}%`,
      color: "var(--color-loss, #3b82f6)",
    },
    {
      label: "샤프 비율",
      value: result.sharpe.toFixed(2),
      color:
        result.sharpe >= 1
          ? "var(--color-profit, #ef4444)"
          : "var(--color-text-secondary)",
    },
    {
      label: "승률",
      value: `${result.winRate.toFixed(1)}%`,
      color:
        result.winRate >= 50
          ? "var(--color-profit, #ef4444)"
          : "var(--color-text-secondary)",
    },
    {
      label: "총 거래 수",
      value: `${result.totalTrades}회`,
      color: "var(--color-text-primary)",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-3"
        >
          <p className="text-xs text-[var(--color-text-tertiary)]">{m.label}</p>
          <p className="mt-1 text-lg font-bold" style={{ color: m.color }}>
            {m.value}
          </p>
        </div>
      ))}
    </div>
  )
}
