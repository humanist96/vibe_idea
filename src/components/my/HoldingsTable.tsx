"use client"

import { usePortfolioStore, type PortfolioItem } from "@/store/portfolio"
import type { QuoteResult } from "@/app/api/user/portfolio/quotes/route"
import { formatCurrency, formatUSD, formatPercent, formatNumber } from "@/lib/utils/format"
import { Pencil, Trash2, Plus } from "lucide-react"

interface Props {
  readonly items: readonly PortfolioItem[]
  readonly quotes: Record<string, QuoteResult>
  readonly isLoading: boolean
  readonly onAdd: () => void
  readonly onEdit: (item: PortfolioItem) => void
}

function getColor(value: number, market: string) {
  if (value === 0) return "text-[var(--color-text-secondary)]"
  if (market === "KR") {
    return value > 0 ? "text-red-500" : "text-blue-500"
  }
  return value > 0 ? "text-green-500" : "text-red-500"
}

export function HoldingsTable({ items, quotes, isLoading, onAdd, onEdit }: Props) {
  const removeItem = usePortfolioStore((s) => s.removeItem)

  const krItems = items.filter((i) => i.market === "KR")
  const usItems = items.filter((i) => i.market === "US")

  const totalValue = items.reduce((sum, item) => {
    const quote = quotes[item.ticker]
    const price = quote?.price ?? item.avgPrice
    return sum + item.quantity * price
  }, 0)

  const renderMobileCard = (item: PortfolioItem) => {
    const quote = quotes[item.ticker]
    const currentPrice = quote?.price ?? item.avgPrice
    const currentValue = item.quantity * currentPrice
    const pnl = currentValue - item.quantity * item.avgPrice
    const pnlPercent = item.avgPrice > 0 ? ((currentPrice - item.avgPrice) / item.avgPrice) * 100 : 0
    const weight = totalValue > 0 ? (currentValue / totalValue) * 100 : 0
    const fmt = item.market === "KR" ? formatCurrency : formatUSD
    const fmtNum = item.market === "KR" ? formatNumber : (v: number) => v.toFixed(2)

    return (
      <div
        key={item.ticker}
        className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-50)] p-4"
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
              {item.name}
            </div>
            <div className="text-xs text-[var(--color-text-muted)]">{item.ticker}</div>
          </div>
          <div className="ml-2 flex items-center gap-1">
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="rounded-lg p-2.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-100)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => removeItem(item.ticker)}
              className="rounded-lg p-2.5 text-[var(--color-text-muted)] hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <span className="text-xs text-[var(--color-text-muted)]">수량</span>
            <p className="text-[var(--color-text-secondary)]">{formatNumber(item.quantity)}주</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-[var(--color-text-muted)]">현재가</span>
            <p className="text-[var(--color-text-primary)]">
              {isLoading && !quote ? "..." : fmtNum(currentPrice)}
            </p>
          </div>
          <div>
            <span className="text-xs text-[var(--color-text-muted)]">매수가</span>
            <p className="text-[var(--color-text-secondary)]">{fmtNum(item.avgPrice)}</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-[var(--color-text-muted)]">손익</span>
            <p className={`font-medium ${getColor(pnl, item.market)}`}>
              {formatPercent(pnlPercent)} <span className="text-xs">{fmt(pnl)}</span>
            </p>
          </div>
        </div>
        <div className="mt-2 text-right text-xs text-[var(--color-text-muted)]">
          비중 {weight.toFixed(1)}%
        </div>
      </div>
    )
  }

  const renderDesktopRow = (item: PortfolioItem) => {
    const quote = quotes[item.ticker]
    const currentPrice = quote?.price ?? item.avgPrice
    const currentValue = item.quantity * currentPrice
    const pnl = currentValue - item.quantity * item.avgPrice
    const pnlPercent = item.avgPrice > 0 ? ((currentPrice - item.avgPrice) / item.avgPrice) * 100 : 0
    const weight = totalValue > 0 ? (currentValue / totalValue) * 100 : 0
    const fmt = item.market === "KR" ? formatCurrency : formatUSD
    const fmtNum = item.market === "KR" ? formatNumber : (v: number) => v.toFixed(2)

    return (
      <tr
        key={item.ticker}
        className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-surface-50)] transition-colors"
      >
        <td className="px-3 py-3">
          <div className="truncate font-medium text-sm text-[var(--color-text-primary)]">{item.name}</div>
          <div className="text-xs text-[var(--color-text-muted)]">{item.ticker}</div>
        </td>
        <td className="px-3 py-3 text-right text-sm text-[var(--color-text-secondary)]">
          {formatNumber(item.quantity)}
        </td>
        <td className="px-3 py-3 text-right text-sm text-[var(--color-text-secondary)]">
          {fmtNum(item.avgPrice)}
        </td>
        <td className="px-3 py-3 text-right text-sm">
          {isLoading && !quote ? (
            <span className="text-[var(--color-text-muted)]">...</span>
          ) : (
            <span className="text-[var(--color-text-primary)]">{fmtNum(currentPrice)}</span>
          )}
        </td>
        <td className={`px-3 py-3 text-right text-sm font-medium ${getColor(pnl, item.market)}`}>
          <div>{formatPercent(pnlPercent)}</div>
          <div className="text-xs">{fmt(pnl)}</div>
        </td>
        <td className="px-3 py-3 text-right text-xs text-[var(--color-text-muted)]">
          {weight.toFixed(1)}%
        </td>
        <td className="px-3 py-3 text-right">
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="rounded-lg p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-100)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => removeItem(item.ticker)}
              className="rounded-lg p-2 text-[var(--color-text-muted)] hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-card)] p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)]">보유 종목</h2>
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          종목 추가
        </button>
      </div>

      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">
          보유 종목이 없습니다. 종목을 추가해보세요.
        </p>
      ) : (
        <>
          {/* Mobile: Card Layout */}
          <div className="space-y-3 sm:hidden">
            {krItems.length > 0 && (
              <>
                <p className="text-xs font-semibold text-[var(--color-text-muted)]">🇰🇷 국내</p>
                {krItems.map(renderMobileCard)}
              </>
            )}
            {usItems.length > 0 && (
              <>
                <p className="mt-4 text-xs font-semibold text-[var(--color-text-muted)]">🇺🇸 해외</p>
                {usItems.map(renderMobileCard)}
              </>
            )}
          </div>

          {/* Desktop: Table Layout */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-xs text-[var(--color-text-muted)]">
                  <th className="px-3 py-2 font-medium">종목</th>
                  <th className="px-3 py-2 text-right font-medium">수량</th>
                  <th className="px-3 py-2 text-right font-medium">매수가</th>
                  <th className="px-3 py-2 text-right font-medium">현재가</th>
                  <th className="px-3 py-2 text-right font-medium">손익</th>
                  <th className="px-3 py-2 text-right font-medium">비중</th>
                  <th className="px-3 py-2 text-right font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {krItems.length > 0 && (
                  <>
                    <tr>
                      <td
                        colSpan={7}
                        className="px-3 py-1.5 text-xs font-semibold text-[var(--color-text-muted)] bg-[var(--color-surface-50)]"
                      >
                        🇰🇷 국내
                      </td>
                    </tr>
                    {krItems.map(renderDesktopRow)}
                  </>
                )}
                {usItems.length > 0 && (
                  <>
                    <tr>
                      <td
                        colSpan={7}
                        className="px-3 py-1.5 text-xs font-semibold text-[var(--color-text-muted)] bg-[var(--color-surface-50)]"
                      >
                        🇺🇸 해외
                      </td>
                    </tr>
                    {usItems.map(renderDesktopRow)}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
