"use client"

import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { BarChart3 } from "lucide-react"
import type { USStockReportData, USStockAnalysis } from "@/lib/report/us-types"

interface USWatchlistOverviewProps {
  readonly stocks: readonly USStockReportData[]
  readonly analyses: readonly USStockAnalysis[]
}

export function USWatchlistOverview({ stocks }: USWatchlistOverviewProps) {
  const validStocks = stocks.filter((s) => s.quote)

  if (validStocks.length === 0) return null

  const maxAbsChange = Math.max(
    ...validStocks.map((s) => Math.abs(s.quote!.changePercent)),
    0.01
  )

  return (
    <Card className="animate-fade-up">
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5 text-[var(--color-accent-500)]" />
            관심종목 성과 총괄
          </span>
        </CardTitle>
      </CardHeader>

      <div className="overflow-x-auto px-4">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--color-border-subtle)]">
              <th className="pb-2 text-left font-semibold text-[var(--color-text-tertiary)]">
                종목
              </th>
              <th className="pb-2 text-right font-semibold text-[var(--color-text-tertiary)]">
                현재가
              </th>
              <th className="pb-2 text-right font-semibold text-[var(--color-text-tertiary)]">
                등락률
              </th>
              <th className="hidden pb-2 text-right font-semibold text-[var(--color-text-tertiary)] sm:table-cell">
                시총
              </th>
              <th className="hidden pb-2 text-right font-semibold text-[var(--color-text-tertiary)] md:table-cell">
                PER
              </th>
              <th className="hidden pb-2 text-right font-semibold text-[var(--color-text-tertiary)] md:table-cell">
                배당률
              </th>
            </tr>
          </thead>
          <tbody>
            {validStocks.map((stock) => {
              const q = stock.quote!
              const m = stock.metrics
              return (
                <tr
                  key={stock.symbol}
                  className="table-row-hover border-b border-[var(--color-border-subtle)] last:border-0"
                >
                  <td className="py-2">
                    <span className="font-medium text-[var(--color-text-primary)]">
                      {stock.nameKr}
                    </span>
                    <span className="ml-1.5 font-mono text-[10px] text-[var(--color-text-muted)]">
                      {stock.symbol}
                    </span>
                  </td>
                  <td className="py-2 text-right tabular-nums font-medium text-[var(--color-text-primary)]">
                    ${q.price.toFixed(2)}
                  </td>
                  <td
                    className="py-2 text-right tabular-nums font-medium"
                    style={{
                      color:
                        q.changePercent >= 0
                          ? "var(--color-gain)"
                          : "var(--color-loss)",
                    }}
                  >
                    {q.changePercent >= 0 ? "+" : ""}
                    {q.changePercent.toFixed(2)}%
                  </td>
                  <td className="hidden py-2 text-right tabular-nums text-[var(--color-text-secondary)] sm:table-cell">
                    {m.marketCap
                      ? m.marketCap >= 1000
                        ? `$${(m.marketCap / 1000).toFixed(0)}B`
                        : `$${m.marketCap.toFixed(0)}M`
                      : "-"}
                  </td>
                  <td className="hidden py-2 text-right tabular-nums text-[var(--color-text-secondary)] md:table-cell">
                    {m.pe ? m.pe.toFixed(1) : "-"}
                  </td>
                  <td className="hidden py-2 text-right tabular-nums text-[var(--color-text-secondary)] md:table-cell">
                    {m.dividendYield
                      ? `${m.dividendYield.toFixed(2)}%`
                      : "-"}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Performance Bar Chart */}
      <div className="px-4 pb-4 pt-2">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          등락률 비교
        </p>
        <div className="space-y-1.5">
          {validStocks.map((s) => {
            const pct = s.quote!.changePercent
            const width = (Math.abs(pct) / maxAbsChange) * 100
            const isPositive = pct >= 0
            return (
              <div key={s.symbol} className="flex items-center gap-2">
                <span className="w-16 text-right text-[10px] font-medium text-[var(--color-text-secondary)] truncate">
                  {s.nameKr}
                </span>
                <div className="relative flex-1 h-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="h-px w-full bg-[var(--color-border-subtle)]" />
                  </div>
                  <div
                    className="absolute top-0.5 h-4 rounded-sm transition-all"
                    style={{
                      width: `${Math.max(width / 2, 2)}%`,
                      left: isPositive
                        ? "50%"
                        : `${50 - width / 2}%`,
                      backgroundColor: isPositive
                        ? "var(--color-gain)"
                        : "var(--color-loss)",
                      opacity: 0.7,
                    }}
                  />
                </div>
                <span
                  className="w-14 text-right text-[10px] font-bold tabular-nums"
                  style={{
                    color: isPositive
                      ? "var(--color-gain)"
                      : "var(--color-loss)",
                  }}
                >
                  {isPositive ? "+" : ""}
                  {pct.toFixed(2)}%
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
