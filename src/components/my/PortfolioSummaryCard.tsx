"use client"

import type { PortfolioItem } from "@/store/portfolio"
import type { QuoteResult } from "@/app/api/user/portfolio/quotes/route"
import { formatCurrency, formatUSD, formatPercent } from "@/lib/utils/format"

interface Props {
  readonly items: readonly PortfolioItem[]
  readonly quotes: Record<string, QuoteResult>
  readonly isLoading: boolean
}

function computeMetrics(items: readonly PortfolioItem[], quotes: Record<string, QuoteResult>) {
  let krTotal = 0
  let krCost = 0
  let krDailyPnL = 0
  let usTotal = 0
  let usCost = 0
  let usDailyPnL = 0

  for (const item of items) {
    const quote = quotes[item.ticker]
    const currentPrice = quote?.price ?? item.avgPrice
    const currentValue = item.quantity * currentPrice
    const costBasis = item.quantity * item.avgPrice
    const dailyPnL = quote ? item.quantity * quote.change : 0

    if (item.market === "KR") {
      krTotal += currentValue
      krCost += costBasis
      krDailyPnL += dailyPnL
    } else {
      usTotal += currentValue
      usCost += costBasis
      usDailyPnL += dailyPnL
    }
  }

  return {
    kr: {
      total: krTotal,
      pnl: krTotal - krCost,
      pnlPercent: krCost > 0 ? ((krTotal - krCost) / krCost) * 100 : 0,
      dailyPnL: krDailyPnL,
    },
    us: {
      total: usTotal,
      pnl: usTotal - usCost,
      pnlPercent: usCost > 0 ? ((usTotal - usCost) / usCost) * 100 : 0,
      dailyPnL: usDailyPnL,
    },
    totalCount: items.length,
  }
}

export function PortfolioSummaryCard({ items, quotes, isLoading }: Props) {
  const m = computeMetrics(items, quotes)
  const hasKR = items.some((i) => i.market === "KR")
  const hasUS = items.some((i) => i.market === "US")

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-card)] p-6">
        <h2 className="mb-2 text-lg font-bold text-[var(--color-text-primary)]">
          포트폴리오 요약
        </h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          보유 종목을 추가하여 포트폴리오를 시작하세요.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-card)] p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
          포트폴리오 요약
        </h2>
        {isLoading && (
          <span className="text-xs text-[var(--color-text-muted)]">시세 갱신 중...</span>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {hasKR && (
          <div className="rounded-xl bg-[var(--color-surface-50)] p-4">
            <div className="mb-1 text-xs font-medium text-[var(--color-text-muted)]">
              🇰🇷 국내 주식
            </div>
            <div className="text-xl font-bold text-[var(--color-text-primary)]">
              {formatCurrency(m.kr.total)}
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm">
              <span className={m.kr.pnl >= 0 ? "text-red-500" : "text-blue-500"}>
                {formatPercent(m.kr.pnlPercent)}
              </span>
              <span className="text-[var(--color-text-muted)]">
                오늘{" "}
                <span className={m.kr.dailyPnL >= 0 ? "text-red-500" : "text-blue-500"}>
                  {m.kr.dailyPnL >= 0 ? "+" : ""}
                  {formatCurrency(m.kr.dailyPnL).replace("₩", "₩")}
                </span>
              </span>
            </div>
          </div>
        )}

        {hasUS && (
          <div className="rounded-xl bg-[var(--color-surface-50)] p-4">
            <div className="mb-1 text-xs font-medium text-[var(--color-text-muted)]">
              🇺🇸 해외 주식
            </div>
            <div className="text-xl font-bold text-[var(--color-text-primary)]">
              {formatUSD(m.us.total)}
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm">
              <span className={m.us.pnl >= 0 ? "text-green-500" : "text-red-500"}>
                {formatPercent(m.us.pnlPercent)}
              </span>
              <span className="text-[var(--color-text-muted)]">
                오늘{" "}
                <span className={m.us.dailyPnL >= 0 ? "text-green-500" : "text-red-500"}>
                  {formatUSD(m.us.dailyPnL)}
                </span>
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 text-xs text-[var(--color-text-muted)]">
        총 {m.totalCount}종목
      </div>
    </div>
  )
}
