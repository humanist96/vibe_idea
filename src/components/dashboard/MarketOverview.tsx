"use client"

import { useEffect, useState } from "react"
import { PriceChange } from "@/components/ui/PriceChange"
import { CardSkeleton } from "@/components/ui/LoadingSkeleton"
import { TrendingUp, BarChart3, DollarSign } from "lucide-react"
import { formatNumber } from "@/lib/utils/format"

interface MarketIndex {
  readonly name: string
  readonly value: number
  readonly change: number
  readonly changePercent: number
}

const icons: Record<string, typeof TrendingUp> = {
  KOSPI: TrendingUp,
  KOSDAQ: BarChart3,
  "USD/KRW": DollarSign,
}

const gradients: Record<string, string> = {
  KOSPI: "from-blue-50 to-blue-100/50",
  KOSDAQ: "from-emerald-50 to-emerald-100/50",
  "USD/KRW": "from-amber-50 to-amber-100/50",
}

const iconColors: Record<string, string> = {
  KOSPI: "text-blue-500",
  KOSDAQ: "text-emerald-500",
  "USD/KRW": "text-amber-500",
}

export function MarketOverview() {
  const [indices, setIndices] = useState<MarketIndex[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/market")
        const json = await res.json()
        if (json.success) {
          setIndices(json.data)
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {indices.map((index, i) => {
        const Icon = icons[index.name] ?? TrendingUp
        const gradient = gradients[index.name] ?? "from-slate-50 to-slate-100/50"
        const iconColor = iconColors[index.name] ?? "text-[var(--color-text-tertiary)]"
        const stagger = `stagger-${i + 1}`

        return (
          <div
            key={index.name}
            className={`animate-fade-up ${stagger} glass-card glass-card-hover relative overflow-hidden p-5`}
          >
            {/* Background gradient */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${gradient} pointer-events-none`}
            />

            <div className="relative">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">
                  {index.name}
                </span>
                <Icon className={`h-4 w-4 ${iconColor}`} />
              </div>

              <p className="font-display text-2xl font-bold tabular-nums text-[var(--color-text-primary)]">
                {index.value != null
                  ? index.name === "USD/KRW"
                    ? `${formatNumber(Math.round(index.value))}`
                    : formatNumber(Number(index.value.toFixed(2)))
                  : "--"}
              </p>

              <PriceChange
                change={index.change}
                changePercent={index.changePercent}
                className="mt-1.5 text-sm"
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
