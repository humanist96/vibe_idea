"use client"

import { useState } from "react"
import { Fragment } from "react"
import { Plus, ChevronDown, ChevronUp } from "lucide-react"
import type { DividendStock, DividendSortField } from "@/lib/dividend/dividend-types"
import { useDividendPortfolioStore } from "@/store/dividend-portfolio"
import { DividendHistoryChart } from "./DividendHistoryChart"
import { GRADE_COLORS, MARKET_BADGE_STYLES } from "./constants"

const COLUMNS: readonly {
  readonly field: DividendSortField | "name"
  readonly label: string
  readonly hideOnMobile?: boolean
}[] = [
  { field: "name", label: "종목" },
  { field: "yield", label: "배당률" },
  { field: "dividendPerShare", label: "주당배당", hideOnMobile: true },
  { field: "growthRate", label: "성장률", hideOnMobile: true },
  { field: "consecutiveYears", label: "연속" },
  { field: "safetyScore", label: "안전" },
]

interface DividendStockTableProps {
  readonly stocks: readonly DividendStock[]
  readonly sort: DividendSortField
  readonly order: "asc" | "desc"
  readonly onSort: (field: DividendSortField) => void
}

export function DividendStockTable({
  stocks,
  sort,
  order,
  onSort,
}: DividendStockTableProps) {
  const [expandedTicker, setExpandedTicker] = useState<string | null>(null)
  const { addItem } = useDividendPortfolioStore()

  function handleAddToPortfolio(stock: DividendStock) {
    addItem({
      ticker: stock.ticker,
      market: stock.market,
      weight: 0,
      name: stock.name,
      nameKr: stock.nameKr,
      sectorKr: stock.sectorKr,
    })
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border-subtle)]">
            {COLUMNS.map((col) => (
              <th
                key={col.field}
                className={
                  "px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wider " +
                  "text-[var(--color-text-tertiary)] " +
                  (col.field !== "name" ? "cursor-pointer hover:text-[var(--color-text-secondary)] " : "") +
                  (col.hideOnMobile ? "hidden md:table-cell" : "")
                }
                onClick={() => col.field !== "name" && onSort(col.field)}
              >
                <span className="flex items-center gap-1">
                  {col.label}
                  {sort === col.field && (
                    <span className="text-blue-400">
                      {order === "desc" ? "↓" : "↑"}
                    </span>
                  )}
                </span>
              </th>
            ))}
            <th className="hidden lg:table-cell px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
              현재가
            </th>
            <th className="hidden lg:table-cell px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
              배당락일
            </th>
            <th className="px-3 py-2.5 w-10" />
            <th className="px-3 py-2.5 w-10" />
          </tr>
        </thead>
        <tbody>
          {stocks.map((stock) => {
            const isExpanded = expandedTicker === `${stock.market}:${stock.ticker}`
            return (
              <Fragment key={`${stock.market}:${stock.ticker}`}>
                <tr
                  className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-glass-1)] cursor-pointer transition-colors"
                  onClick={() =>
                    setExpandedTicker(
                      isExpanded ? null : `${stock.market}:${stock.ticker}`
                    )
                  }
                >
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          "rounded px-1.5 py-0.5 text-[10px] font-bold " +
                          MARKET_BADGE_STYLES[stock.market]
                        }
                      >
                        {stock.market}
                      </span>
                      <div>
                        <div className="font-medium text-[var(--color-text-primary)]">
                          {stock.nameKr}
                        </div>
                        <div className="text-[10px] text-[var(--color-text-muted)]">
                          {stock.ticker}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 tabular-nums font-medium text-amber-400">
                    {stock.dividendYield.toFixed(2)}%
                  </td>
                  <td className="hidden md:table-cell px-3 py-3 tabular-nums text-[var(--color-text-secondary)]">
                    {stock.currency === "KRW"
                      ? `${stock.dividendPerShare.toLocaleString()}원`
                      : `$${stock.dividendPerShare.toFixed(2)}`}
                  </td>
                  <td className="hidden md:table-cell px-3 py-3 tabular-nums">
                    {stock.dividendGrowthRate !== null ? (
                      <span
                        className={
                          stock.dividendGrowthRate >= 0
                            ? "text-emerald-400"
                            : "text-red-400"
                        }
                      >
                        {stock.dividendGrowthRate > 0 ? "+" : ""}
                        {stock.dividendGrowthRate.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-[var(--color-text-muted)]">--</span>
                    )}
                  </td>
                  <td className="px-3 py-3 tabular-nums text-[var(--color-text-secondary)]">
                    {stock.consecutiveYears}년
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={
                        "font-bold " + (GRADE_COLORS[stock.safetyGrade] ?? "")
                      }
                    >
                      {stock.safetyGrade}
                    </span>
                  </td>
                  <td className="hidden lg:table-cell px-3 py-3 tabular-nums text-[var(--color-text-secondary)]">
                    {stock.currency === "KRW"
                      ? `${stock.currentPrice.toLocaleString()}원`
                      : `$${stock.currentPrice.toFixed(2)}`}
                  </td>
                  <td className="hidden lg:table-cell px-3 py-3 text-xs text-[var(--color-text-muted)]">
                    {stock.exDividendDate ?? "--"}
                  </td>
                  <td className="px-3 py-3">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-[var(--color-text-muted)]" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-[var(--color-text-muted)]" />
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAddToPortfolio(stock)
                      }}
                      className="rounded-md bg-blue-500/10 p-1.5 text-blue-400 hover:bg-blue-500/20 transition-colors"
                      aria-label={`${stock.nameKr} 포트폴리오에 추가`}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
                {isExpanded && (
                  <tr>
                    <td
                      colSpan={10}
                      className="bg-[var(--color-glass-1)] px-4 py-4"
                    >
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                            배당 이력
                          </h4>
                          <DividendHistoryChart
                            history={stock.dividendHistory}
                            currency={stock.currency}
                          />
                        </div>
                        <div className="space-y-3">
                          <div>
                            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                              상세 정보
                            </h4>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <InfoRow
                                label="배당성향"
                                value={
                                  stock.payoutRatio !== null
                                    ? `${stock.payoutRatio}%`
                                    : "--"
                                }
                              />
                              <InfoRow label="지급빈도" value={frequencyLabel(stock.frequency)} />
                              <InfoRow label="섹터" value={stock.sectorKr} />
                              <InfoRow
                                label="현재가"
                                value={
                                  stock.currency === "KRW"
                                    ? `${stock.currentPrice.toLocaleString()}원`
                                    : `$${stock.currentPrice.toFixed(2)}`
                                }
                              />
                              <InfoRow label="배당락일" value={stock.exDividendDate ?? "--"} />
                              <InfoRow
                                label="배당월"
                                value={stock.paymentMonths.map((m) => `${m}월`).join(", ")}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function InfoRow({
  label,
  value,
}: {
  readonly label: string
  readonly value: string
}) {
  return (
    <div className="flex justify-between rounded-md bg-[var(--color-glass-2)] px-2.5 py-1.5">
      <span className="text-[var(--color-text-tertiary)]">{label}</span>
      <span className="font-medium text-[var(--color-text-secondary)]">
        {value}
      </span>
    </div>
  )
}

function frequencyLabel(freq: string): string {
  const map: Record<string, string> = {
    annual: "연 1회",
    semi: "반기",
    quarterly: "분기",
    monthly: "월",
  }
  return map[freq] ?? freq
}
