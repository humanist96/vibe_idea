"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { Grid3X3 } from "lucide-react"

interface SectorValuation {
  readonly sector: string
  readonly sectorKr: string
  readonly stockCount: number
  readonly avgPE: number | null
  readonly avgPB: number | null
  readonly totalMarketCap: number
  readonly avgDividendYield: number | null
  readonly topStocks: readonly { symbol: string; nameKr: string; marketCap: number }[]
}

function formatMarketCap(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}T`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}B`
  return `$${v.toFixed(0)}M`
}

export default function USValuationPage() {
  const [data, setData] = useState<SectorValuation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/us-stocks/valuation")
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

  const totalMarketCap = data.reduce((s, d) => s + d.totalMarketCap, 0)

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          US 밸류에이션
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
          S&P 500 섹터별 시가총액 및 밸류에이션 지표
        </p>
      </div>

      {loading ? (
        <div className="space-y-4 animate-fade-up stagger-2">
          <LoadingSkeleton className="h-24 w-full rounded-lg" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <LoadingSkeleton key={i} className="h-40 w-full rounded-lg" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Total summary */}
          <div className="animate-fade-up stagger-1 glass-card rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase text-[var(--color-text-muted)]">
              전체 시가총액 (레지스트리 기준)
            </p>
            <p className="mt-1 text-3xl font-bold text-[var(--color-text-primary)]">
              {formatMarketCap(totalMarketCap)}
            </p>
          </div>

          {/* Treemap-like cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-fade-up stagger-2">
            {data.map((sector) => {
              const pct = totalMarketCap > 0
                ? ((sector.totalMarketCap / totalMarketCap) * 100).toFixed(1)
                : "0"

              return (
                <Card key={sector.sector} className="glass-card-hover">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-[var(--color-text-primary)]">
                        {sector.sectorKr}
                      </p>
                      <p className="text-[10px] text-[var(--color-text-muted)]">
                        {sector.stockCount}종목 · {pct}%
                      </p>
                    </div>
                    <p className="text-lg font-bold text-[var(--color-accent-400)] tabular-nums">
                      {formatMarketCap(sector.totalMarketCap)}
                    </p>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-[10px] text-[var(--color-text-muted)]">PER</p>
                      <p className="text-sm font-semibold tabular-nums text-[var(--color-text-primary)]">
                        {sector.avgPE?.toFixed(1) ?? "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[var(--color-text-muted)]">PBR</p>
                      <p className="text-sm font-semibold tabular-nums text-[var(--color-text-primary)]">
                        {sector.avgPB?.toFixed(2) ?? "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[var(--color-text-muted)]">배당률</p>
                      <p className="text-sm font-semibold tabular-nums text-[var(--color-text-primary)]">
                        {sector.avgDividendYield
                          ? `${sector.avgDividendYield.toFixed(1)}%`
                          : "-"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {sector.topStocks.map((s) => (
                      <span
                        key={s.symbol}
                        className="rounded-md bg-[var(--color-surface-50)] px-1.5 py-0.5 text-[10px] text-[var(--color-text-secondary)]"
                      >
                        {s.nameKr}
                      </span>
                    ))}
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Summary table */}
          <Card className="animate-fade-up stagger-3">
            <CardHeader>
              <CardTitle>
                <span className="flex items-center gap-2">
                  <Grid3X3 className="h-3.5 w-3.5 text-[var(--color-accent-500)]" />
                  섹터별 밸류에이션 비교
                </span>
              </CardTitle>
            </CardHeader>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border-subtle)]">
                    <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">섹터</th>
                    <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">시총</th>
                    <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">비중</th>
                    <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">평균 PER</th>
                    <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">평균 PBR</th>
                    <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">평균 배당률</th>
                    <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">종목수</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((s) => (
                    <tr key={s.sector} className="table-row-hover border-b border-[var(--color-border-subtle)] last:border-0">
                      <td className="py-2.5 font-medium text-[var(--color-text-primary)]">{s.sectorKr}</td>
                      <td className="py-2.5 text-right tabular-nums text-[var(--color-text-secondary)]">{formatMarketCap(s.totalMarketCap)}</td>
                      <td className="py-2.5 text-right tabular-nums text-[var(--color-text-secondary)]">
                        {totalMarketCap > 0 ? `${((s.totalMarketCap / totalMarketCap) * 100).toFixed(1)}%` : "-"}
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-[var(--color-text-secondary)]">{s.avgPE?.toFixed(1) ?? "-"}</td>
                      <td className="py-2.5 text-right tabular-nums text-[var(--color-text-secondary)]">{s.avgPB?.toFixed(2) ?? "-"}</td>
                      <td className="py-2.5 text-right tabular-nums text-[var(--color-text-secondary)]">{s.avgDividendYield ? `${s.avgDividendYield.toFixed(1)}%` : "-"}</td>
                      <td className="py-2.5 text-right tabular-nums text-[var(--color-text-tertiary)]">{s.stockCount}</td>
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
