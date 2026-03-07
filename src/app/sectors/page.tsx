"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { Grid3X3, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils/cn"

interface SectorStock {
  readonly ticker: string
  readonly name: string
  readonly return1m: number
}

interface SectorPerformance {
  readonly sector: string
  readonly return1w: number
  readonly return1m: number
  readonly return3m: number
  readonly return6m: number
  readonly momentum: "accelerating" | "decelerating" | "stable"
  readonly stocks: readonly SectorStock[]
}

type PeriodKey = "return1w" | "return1m" | "return3m" | "return6m"

const PERIODS: readonly { readonly key: PeriodKey; readonly label: string }[] = [
  { key: "return1w", label: "1주" },
  { key: "return1m", label: "1개월" },
  { key: "return3m", label: "3개월" },
  { key: "return6m", label: "6개월" },
]

function getHeatColor(value: number): string {
  if (value >= 10) return "bg-red-500 text-white"
  if (value >= 5) return "bg-red-400 text-white"
  if (value >= 2) return "bg-red-300 text-red-900"
  if (value >= 0) return "bg-red-100 text-red-800"
  if (value >= -2) return "bg-blue-100 text-blue-800"
  if (value >= -5) return "bg-blue-300 text-blue-900"
  if (value >= -10) return "bg-blue-400 text-white"
  return "bg-blue-500 text-white"
}

function MomentumIcon({ momentum }: { readonly momentum: SectorPerformance["momentum"] }) {
  switch (momentum) {
    case "accelerating":
      return <TrendingUp className="h-3.5 w-3.5 text-[var(--color-gain)]" />
    case "decelerating":
      return <TrendingDown className="h-3.5 w-3.5 text-[var(--color-loss)]" />
    default:
      return <Minus className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
  }
}

export default function SectorsPage() {
  const [data, setData] = useState<SectorPerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedSector, setExpandedSector] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/sectors/performance")
        const json = await res.json()
        if (json.success) {
          setData(json.data ?? [])
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          섹터 로테이션
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
          업종별 기간 수익률 히트맵 — 빨강(강세) / 파랑(약세)
        </p>
      </div>

      {loading ? (
        <div className="animate-fade-up stagger-2">
          <LoadingSkeleton className="h-96 w-full rounded-lg" />
        </div>
      ) : data.length === 0 ? (
        <Card className="animate-fade-up stagger-2">
          <div className="py-12 text-center text-[var(--color-text-tertiary)]">
            섹터 데이터를 불러올 수 없습니다.
          </div>
        </Card>
      ) : (
        <Card className="animate-fade-up stagger-2">
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <Grid3X3 className="h-3.5 w-3.5 text-[var(--color-accent-500)]" />
                섹터별 수익률 히트맵
                <span className="text-xs font-normal text-[var(--color-text-tertiary)]">
                  ({data.length}개 섹터)
                </span>
              </span>
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border-subtle)]">
                  <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                    업종
                  </th>
                  {PERIODS.map((p) => (
                    <th
                      key={p.key}
                      className="pb-2 text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]"
                    >
                      {p.label}
                    </th>
                  ))}
                  <th className="pb-2 text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                    모멘텀
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((sector) => (
                  <>
                    <tr
                      key={sector.sector}
                      className="table-row-hover border-b border-[var(--color-border-subtle)] cursor-pointer"
                      onClick={() =>
                        setExpandedSector((prev) =>
                          prev === sector.sector ? null : sector.sector
                        )
                      }
                    >
                      <td className="py-2.5 font-medium text-[var(--color-text-primary)]">
                        {sector.sector}
                      </td>
                      {PERIODS.map((p) => {
                        const val = sector[p.key]
                        return (
                          <td key={p.key} className="py-2 text-center">
                            <span
                              className={cn(
                                "inline-block min-w-[56px] rounded px-2 py-1 text-xs font-semibold tabular-nums",
                                getHeatColor(val)
                              )}
                            >
                              {val >= 0 ? "+" : ""}
                              {val.toFixed(1)}%
                            </span>
                          </td>
                        )
                      })}
                      <td className="py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <MomentumIcon momentum={sector.momentum} />
                          <span className="text-[10px] text-[var(--color-text-muted)]">
                            {sector.momentum === "accelerating"
                              ? "가속"
                              : sector.momentum === "decelerating"
                                ? "감속"
                                : "안정"}
                          </span>
                        </div>
                      </td>
                    </tr>
                    {expandedSector === sector.sector && sector.stocks.length > 0 && (
                      <tr key={`${sector.sector}-detail`}>
                        <td colSpan={6} className="bg-[var(--color-surface-50)] px-4 py-2">
                          <div className="flex flex-wrap gap-2">
                            {sector.stocks.map((stock) => (
                              <Link
                                key={stock.ticker}
                                href={`/stock/${stock.ticker}`}
                                className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs shadow-sm transition-colors hover:bg-[var(--color-surface-100)]"
                              >
                                <span className="font-medium text-[var(--color-text-primary)]">
                                  {stock.name}
                                </span>
                                <span
                                  className={cn(
                                    "tabular-nums",
                                    stock.return1m >= 0
                                      ? "text-[var(--color-gain)]"
                                      : "text-[var(--color-loss)]"
                                  )}
                                >
                                  {stock.return1m >= 0 ? "+" : ""}
                                  {stock.return1m.toFixed(1)}%
                                </span>
                              </Link>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
