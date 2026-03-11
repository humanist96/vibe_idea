"use client"

import type { PortfolioSummary } from "@/lib/portfolio/types"

interface PortfolioSummaryCardsProps {
  readonly summary: PortfolioSummary | null
  readonly isLoading: boolean
}

function formatKRW(value: number): string {
  if (Math.abs(value) >= 100_000_000) {
    return `${(value / 100_000_000).toFixed(2)}억`
  }
  if (Math.abs(value) >= 10_000) {
    return `${(value / 10_000).toFixed(0)}만`
  }
  return value.toLocaleString()
}

function Skeleton() {
  return (
    <div className="h-16 animate-pulse rounded-lg bg-[var(--color-bg-base)]" />
  )
}

export function PortfolioSummaryCards({
  summary,
  isLoading,
}: PortfolioSummaryCardsProps) {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} />
        ))}
      </div>
    )
  }

  const cards = [
    {
      label: "총 평가금액",
      value: `${formatKRW(summary.totalValue)}원`,
      color: "var(--color-text-primary)",
    },
    {
      label: "총 손익",
      value: `${summary.totalPnl >= 0 ? "+" : ""}${formatKRW(summary.totalPnl)}원`,
      sub: `${summary.totalPnlPct >= 0 ? "+" : ""}${summary.totalPnlPct.toFixed(2)}%`,
      color:
        summary.totalPnl > 0
          ? "var(--color-profit, #ef4444)"
          : summary.totalPnl < 0
            ? "var(--color-loss, #3b82f6)"
            : "var(--color-text-secondary)",
    },
    {
      label: "일간 손익",
      value: `${summary.dailyPnl >= 0 ? "+" : ""}${formatKRW(summary.dailyPnl)}원`,
      sub: `${summary.dailyPnlPct >= 0 ? "+" : ""}${summary.dailyPnlPct.toFixed(2)}%`,
      color:
        summary.dailyPnl > 0
          ? "var(--color-profit, #ef4444)"
          : summary.dailyPnl < 0
            ? "var(--color-loss, #3b82f6)"
            : "var(--color-text-secondary)",
    },
    {
      label: "투자 원금",
      value: `${formatKRW(summary.totalCost)}원`,
      color: "var(--color-text-primary)",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4"
        >
          <p className="text-xs text-[var(--color-text-tertiary)]">
            {card.label}
          </p>
          <p
            className="mt-1 text-lg font-bold"
            style={{ color: card.color }}
          >
            {card.value}
          </p>
          {card.sub && (
            <p className="text-xs" style={{ color: card.color }}>
              {card.sub}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
