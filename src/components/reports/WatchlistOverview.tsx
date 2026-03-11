"use client"

import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { PerformanceBar } from "./charts/PerformanceBar"
import type { StockReportData, StockAnalysis } from "@/lib/report/types"
import { formatCurrency, formatNumber } from "@/lib/utils/format"
import { BarChart3 } from "lucide-react"
import { ACTION_BADGE_COLORS } from "./report-constants"

interface WatchlistOverviewProps {
  readonly stocks: readonly StockReportData[]
  readonly analyses: readonly StockAnalysis[]
}

export function WatchlistOverview({ stocks, analyses }: WatchlistOverviewProps) {
  const validStocks = stocks.filter((s) => s.quote)

  if (validStocks.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5 text-[var(--color-accent-500)]" />
            관심종목 성과 총괄
          </span>
        </CardTitle>
      </CardHeader>

      {/* Performance Table */}
      <div className="overflow-x-auto px-4">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--color-border-subtle)]">
              <th className="pb-2 text-left font-semibold text-[var(--color-text-tertiary)]">종목</th>
              <th className="pb-2 text-right font-semibold text-[var(--color-text-tertiary)]">종가</th>
              <th className="pb-2 text-right font-semibold text-[var(--color-text-tertiary)]">등락률</th>
              <th className="hidden pb-2 text-right font-semibold text-[var(--color-text-tertiary)] sm:table-cell">거래량</th>
              <th className="hidden pb-2 text-right font-semibold text-[var(--color-text-tertiary)] md:table-cell">수급</th>
              <th className="pb-2 text-right font-semibold text-[var(--color-text-tertiary)]">AI점수</th>
              <th className="hidden pb-2 text-center font-semibold text-[var(--color-text-tertiary)] lg:table-cell">확신도</th>
              <th className="hidden pb-2 text-center font-semibold text-[var(--color-text-tertiary)] lg:table-cell">액션</th>
            </tr>
          </thead>
          <tbody>
            {validStocks.map((stock) => {
              const q = stock.quote!
              const flow = stock.investorFlow?.entries?.[0]
              const foreignLabel = flow
                ? flow.foreignNet > 0
                  ? "외+▲"
                  : flow.foreignNet < 0
                    ? "외-▼"
                    : "외→"
                : "-"
              const aiScore = stock.aiScore?.aiScore
              const analysis = analyses.find((a) => a.ticker === stock.ticker)
              const conviction = analysis?.conviction
              const actionItem = analysis?.actionItem

              const convictionColor = conviction
                ? conviction.score >= 7 ? "text-green-600"
                  : conviction.score >= 4 ? "text-amber-600"
                  : "text-red-600"
                : ""

              return (
                <tr key={stock.ticker} className="table-row-hover border-b border-[var(--color-border-subtle)] last:border-0">
                  <td className="py-2 font-medium text-[var(--color-text-primary)]">
                    {stock.name}
                  </td>
                  <td className="py-2 text-right tabular-nums font-medium text-[var(--color-text-primary)]">
                    {formatCurrency(q.price)}
                  </td>
                  <td
                    className="py-2 text-right tabular-nums font-medium"
                    style={{ color: q.changePercent >= 0 ? "var(--color-gain)" : "var(--color-loss)" }}
                  >
                    {q.changePercent >= 0 ? "+" : ""}{q.changePercent.toFixed(2)}%
                  </td>
                  <td className="hidden py-2 text-right tabular-nums text-[var(--color-text-secondary)] sm:table-cell">
                    {formatNumber(q.volume)}
                  </td>
                  <td className="hidden py-2 text-right text-[var(--color-text-secondary)] md:table-cell">
                    {foreignLabel}
                  </td>
                  <td className="py-2 text-right">
                    {aiScore != null ? (
                      <span className="font-bold tabular-nums text-[var(--color-accent-400)]">
                        {aiScore.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-[var(--color-text-muted)]">-</span>
                    )}
                  </td>
                  <td className="hidden py-2 text-center lg:table-cell">
                    {conviction ? (
                      <span className={`font-bold tabular-nums text-xs ${convictionColor}`}>
                        {conviction.score}/10
                      </span>
                    ) : (
                      <span className="text-[var(--color-text-muted)]">-</span>
                    )}
                  </td>
                  <td className="hidden py-2 text-center lg:table-cell">
                    {actionItem ? (
                      <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${ACTION_BADGE_COLORS[actionItem.action] ?? "bg-gray-100 text-gray-700"}`}>
                        {actionItem.action}
                      </span>
                    ) : (
                      <span className="text-[var(--color-text-muted)]">-</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Performance Bar Chart */}
      <div className="p-4">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          등락률 비교
        </p>
        <PerformanceBar
          items={validStocks.map((s) => ({
            name: s.name,
            changePercent: s.quote!.changePercent,
          }))}
        />
      </div>
    </Card>
  )
}
