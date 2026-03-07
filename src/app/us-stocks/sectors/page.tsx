"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { PieChart } from "lucide-react"
import { cn } from "@/lib/utils/cn"

interface SectorData {
  readonly symbol: string
  readonly name: string
  readonly nameKr: string
  readonly sector: string
  readonly sectorKr: string
  readonly price: number
  readonly return1W: number | null
  readonly return1M: number | null
  readonly return3M: number | null
  readonly return6M: number | null
}

type Period = "1W" | "1M" | "3M" | "6M"

const PERIOD_KEY: Record<Period, keyof SectorData> = {
  "1W": "return1W",
  "1M": "return1M",
  "3M": "return3M",
  "6M": "return6M",
}

function getHeatColor(value: number | null): string {
  if (value === null) return "bg-gray-100 text-gray-400"
  if (value > 5) return "bg-green-500 text-white"
  if (value > 2) return "bg-green-400 text-white"
  if (value > 0) return "bg-green-200 text-green-800"
  if (value > -2) return "bg-red-200 text-red-800"
  if (value > -5) return "bg-red-400 text-white"
  return "bg-red-500 text-white"
}

export default function USSectorsPage() {
  const [data, setData] = useState<SectorData[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<Period>("1M")

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/us-stocks/sectors")
        const json = await res.json()
        if (json.success) setData(json.data)
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const sorted = [...data].sort((a, b) => {
    const key = PERIOD_KEY[period]
    return ((b[key] as number) ?? 0) - ((a[key] as number) ?? 0)
  })

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          US 섹터 로테이션
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
          SPDR 섹터 ETF 기반 수익률 비교
        </p>
      </div>

      <div className="flex gap-1 animate-fade-up stagger-1">
        {(["1W", "1M", "3M", "6M"] as Period[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
              period === p
                ? "bg-[var(--color-accent-400)] text-white"
                : "text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-50)]"
            )}
          >
            {p}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4 animate-fade-up stagger-2">
          <LoadingSkeleton className="h-64 w-full rounded-lg" />
        </div>
      ) : (
        <>
          {/* Heatmap cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 animate-fade-up stagger-2">
            {sorted.map((sector) => {
              const value = sector[PERIOD_KEY[period]] as number | null
              return (
                <div
                  key={sector.symbol}
                  className={cn(
                    "rounded-xl p-4 transition-all",
                    getHeatColor(value)
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold">{sector.sectorKr}</p>
                      <p className="text-xs opacity-80">{sector.symbol}</p>
                    </div>
                    <p className="text-2xl font-bold tabular-nums">
                      {value !== null ? `${value > 0 ? "+" : ""}${value.toFixed(1)}%` : "-"}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Detail table */}
          <Card className="animate-fade-up stagger-3">
            <CardHeader>
              <CardTitle>
                <span className="flex items-center gap-2">
                  <PieChart className="h-3.5 w-3.5 text-[var(--color-accent-500)]" />
                  섹터별 수익률 상세
                </span>
              </CardTitle>
            </CardHeader>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border-subtle)]">
                    <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">섹터</th>
                    <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">현재가</th>
                    <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">1주</th>
                    <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">1개월</th>
                    <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">3개월</th>
                    <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">6개월</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((s) => (
                    <tr key={s.symbol} className="table-row-hover border-b border-[var(--color-border-subtle)] last:border-0">
                      <td className="py-2.5">
                        <span className="font-medium text-[var(--color-text-primary)]">{s.sectorKr}</span>
                        <span className="ml-1.5 text-[10px] text-[var(--color-text-muted)]">{s.symbol}</span>
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-[var(--color-text-primary)]">
                        ${s.price.toFixed(2)}
                      </td>
                      {([s.return1W, s.return1M, s.return3M, s.return6M] as (number | null)[]).map((v, i) => (
                        <td
                          key={i}
                          className={cn(
                            "py-2.5 text-right tabular-nums font-medium",
                            v !== null && v > 0
                              ? "text-[var(--color-gain)]"
                              : v !== null && v < 0
                                ? "text-[var(--color-loss)]"
                                : "text-[var(--color-text-tertiary)]"
                          )}
                        >
                          {v !== null ? `${v > 0 ? "+" : ""}${v.toFixed(1)}%` : "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
