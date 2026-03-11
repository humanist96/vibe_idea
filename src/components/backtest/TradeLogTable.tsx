"use client"

import { useState, useMemo } from "react"
import type { TradeEntry } from "@/lib/backtest/types"

interface TradeLogTableProps {
  readonly trades: readonly TradeEntry[]
}

type SortField = "date" | "type" | "price" | "returnPct"

export function TradeLogTable({ trades }: TradeLogTableProps) {
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortAsc, setSortAsc] = useState(false)

  const sorted = useMemo(() => {
    const copy = [...trades]
    copy.sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case "date":
          cmp = a.date.localeCompare(b.date)
          break
        case "type":
          cmp = a.type.localeCompare(b.type)
          break
        case "price":
          cmp = a.price - b.price
          break
        case "returnPct":
          cmp = (a.returnPct ?? 0) - (b.returnPct ?? 0)
          break
      }
      return sortAsc ? cmp : -cmp
    })
    return copy
  }, [trades, sortField, sortAsc])

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc((prev) => !prev)
    } else {
      setSortField(field)
      setSortAsc(false)
    }
  }

  if (trades.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-[var(--color-text-tertiary)]">
        거래 내역이 없습니다
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-card)]">
            {(
              [
                { field: "date" as SortField, label: "날짜" },
                { field: "type" as SortField, label: "유형" },
                { field: "price" as SortField, label: "가격" },
                { field: "returnPct" as SortField, label: "수익률" },
              ] as const
            ).map(({ field, label }) => (
              <th
                key={field}
                onClick={() => toggleSort(field)}
                className="cursor-pointer px-4 py-2.5 text-left text-xs font-medium text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
              >
                {label}{" "}
                {sortField === field ? (sortAsc ? "▲" : "▼") : ""}
              </th>
            ))}
            <th className="px-4 py-2.5 text-right text-xs font-medium text-[var(--color-text-tertiary)]">
              수량
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((trade, idx) => (
            <tr
              key={`${trade.date}-${trade.type}-${idx}`}
              className="border-b border-[var(--color-border)] last:border-0"
            >
              <td className="px-4 py-2 text-[var(--color-text-secondary)]">
                {trade.date}
              </td>
              <td className="px-4 py-2">
                <span
                  className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${
                    trade.type === "BUY"
                      ? "bg-red-500/10 text-red-400"
                      : "bg-blue-500/10 text-blue-400"
                  }`}
                >
                  {trade.type === "BUY" ? "매수" : "매도"}
                </span>
              </td>
              <td className="px-4 py-2 text-[var(--color-text-primary)]">
                {trade.price.toLocaleString()}
              </td>
              <td className="px-4 py-2">
                {trade.returnPct !== undefined ? (
                  <span
                    style={{
                      color:
                        trade.returnPct > 0
                          ? "var(--color-profit, #ef4444)"
                          : trade.returnPct < 0
                            ? "var(--color-loss, #3b82f6)"
                            : "var(--color-text-secondary)",
                    }}
                  >
                    {trade.returnPct > 0 ? "+" : ""}
                    {trade.returnPct.toFixed(2)}%
                  </span>
                ) : (
                  <span className="text-[var(--color-text-tertiary)]">-</span>
                )}
              </td>
              <td className="px-4 py-2 text-right text-[var(--color-text-secondary)]">
                {trade.shares.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
