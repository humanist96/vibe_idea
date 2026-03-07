"use client"

import { useEffect, useState } from "react"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { TickerTape } from "./TickerTape"

interface MarketIndex {
  readonly name: string
  readonly value: number
  readonly change: number
  readonly changePercent: number
}

interface FearGreedData {
  readonly score: number
  readonly label: string
}

export function MarketBar() {
  const [indices, setIndices] = useState<MarketIndex[]>([])
  const [fearGreed, setFearGreed] = useState<FearGreedData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const [marketRes, fgRes] = await Promise.allSettled([
        fetch("/api/market").then((r) => r.json()),
        fetch("/api/fear-greed").then((r) => r.json()),
      ])

      if (marketRes.status === "fulfilled" && marketRes.value.success) {
        setIndices(marketRes.value.data)
      }
      if (fgRes.status === "fulfilled" && fgRes.value.success) {
        setFearGreed(fgRes.value.data)
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="animate-fade-up glass-card overflow-hidden rounded-xl">
        <div className="flex items-center gap-6 px-4 py-3">
          <div className="skeleton-shimmer h-5 w-32 rounded" />
          <div className="skeleton-shimmer h-5 w-32 rounded" />
          <div className="skeleton-shimmer h-5 w-32 rounded" />
        </div>
        <div className="border-t border-[var(--color-border-subtle)] px-4 py-2">
          <div className="skeleton-shimmer h-4 w-full rounded" />
        </div>
      </div>
    )
  }

  const fgColor =
    fearGreed && fearGreed.score <= 25
      ? "#2563eb"
      : fearGreed && fearGreed.score <= 45
        ? "#6366f1"
        : fearGreed && fearGreed.score <= 55
          ? "#737373"
          : fearGreed && fearGreed.score <= 75
            ? "#f59e0b"
            : "#dc2626"

  return (
    <div className="animate-fade-up glass-card overflow-hidden rounded-xl">
      {/* Row 1: Market Indices */}
      <div className="flex items-center gap-2 overflow-x-auto px-4 py-3 scrollbar-none">
        {indices.map((idx) => {
          const isUp = idx.change > 0
          const isDown = idx.change < 0
          const color = isUp
            ? "var(--color-gain)"
            : isDown
              ? "var(--color-loss)"
              : "var(--color-text-muted)"

          const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus

          return (
            <div key={idx.name} className="flex shrink-0 items-center gap-2 rounded-lg bg-[var(--color-surface-50)] px-3 py-1.5">
              <span className="text-[11px] font-semibold text-[var(--color-text-tertiary)]">
                {idx.name}
              </span>
              <span className="text-sm font-bold tabular-nums text-[var(--color-text-primary)]">
                {idx.name === "USD/KRW"
                  ? idx.value.toLocaleString("ko-KR", { maximumFractionDigits: 0 })
                  : idx.value.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}
              </span>
              <span className="flex items-center gap-0.5 text-xs font-semibold tabular-nums" style={{ color }}>
                <Icon className="h-3 w-3" />
                {isUp ? "+" : ""}
                {idx.changePercent.toFixed(2)}%
              </span>
            </div>
          )
        })}

        {/* Fear & Greed Mini */}
        {fearGreed && (
          <div className="flex shrink-0 items-center gap-2 rounded-lg bg-[var(--color-surface-50)] px-3 py-1.5">
            <span className="text-[11px] font-semibold text-[var(--color-text-tertiary)]">공포탐욕</span>
            <span className="text-sm font-bold tabular-nums" style={{ color: fgColor }}>
              {fearGreed.score}
            </span>
            {/* Mini progress bar */}
            <div className="h-1.5 w-12 overflow-hidden rounded-full bg-[var(--color-surface-100)]">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${fearGreed.score}%`,
                  backgroundColor: fgColor,
                }}
              />
            </div>
            <span className="text-[10px] text-[var(--color-text-muted)]">{fearGreed.label}</span>
          </div>
        )}
      </div>

      {/* Row 2: Ticker Tape */}
      <div className="border-t border-[var(--color-border-subtle)]">
        <TickerTape />
      </div>
    </div>
  )
}
