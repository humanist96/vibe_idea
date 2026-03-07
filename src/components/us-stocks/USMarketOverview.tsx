"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils/cn"
import { TrendingUp, TrendingDown } from "lucide-react"

interface IndexData {
  readonly symbol: string
  readonly name: string
  readonly nameKr: string
  readonly price: number
  readonly change: number
  readonly changePercent: number
}

interface MarketData {
  readonly indices: readonly IndexData[]
  readonly market: {
    readonly isOpen: boolean
    readonly session: string
  }
}

export function USMarketOverview() {
  const [data, setData] = useState<MarketData | null>(null)

  useEffect(() => {
    async function fetch_() {
      try {
        const res = await fetch("/api/us-stocks/market")
        const json = await res.json()
        if (json.success) setData(json.data)
      } catch {
        // silently fail
      }
    }
    fetch_()
  }, [])

  if (!data) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card h-24 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <div className={cn(
          "h-2 w-2 rounded-full",
          data.market.isOpen ? "bg-emerald-400 animate-pulse" : "bg-slate-300"
        )} />
        <span className="text-[11px] font-medium text-[var(--color-text-muted)]">
          {data.market.isOpen ? "장중" : "장 마감"}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {data.indices.map((idx) => {
          const isUp = idx.changePercent >= 0
          return (
            <div key={idx.symbol} className="glass-card px-4 py-3 transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-[var(--color-text-muted)]">
                  {idx.nameKr}
                </span>
                {isUp ? (
                  <TrendingUp className="h-3.5 w-3.5 text-[var(--color-gain)]" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-[var(--color-loss)]" />
                )}
              </div>
              <p className="mt-1 font-mono text-lg font-bold tabular-nums text-[var(--color-text-primary)]">
                ${idx.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className={cn(
                "mt-0.5 font-mono text-xs font-semibold tabular-nums",
                isUp ? "text-[var(--color-gain)]" : "text-[var(--color-loss)]"
              )}>
                {isUp ? "+" : ""}{idx.changePercent.toFixed(2)}%
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
