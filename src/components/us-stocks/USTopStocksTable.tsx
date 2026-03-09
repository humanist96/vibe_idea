"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils/cn"
import { formatUSD, formatMarketCapUSD } from "@/lib/utils/format"
import { TrendingUp, TrendingDown } from "lucide-react"

interface StockRow {
  readonly symbol: string
  readonly name: string
  readonly nameKr: string
  readonly sector: string
  readonly sectorKr: string
  readonly exchange: string
  readonly price: number
  readonly change: number
  readonly changePercent: number
}

export function USTopStocksTable() {
  const [stocks, setStocks] = useState<StockRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch_() {
      try {
        const res = await fetch("/api/us-stocks/market")
        const json = await res.json()
        if (json.success) setStocks(json.data.stocks)
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetch_()
  }, [])

  if (loading) {
    return (
      <div className="glass-card p-5">
        <div className="h-8 w-40 animate-pulse rounded bg-slate-100" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-slate-50" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card p-5">
      <h2 className="mb-4 text-sm font-semibold text-[var(--color-text-secondary)]">
        시가총액 상위
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border-default)]">
              <th className="pb-2 text-left text-[11px] font-medium text-[var(--color-text-muted)]">#</th>
              <th className="pb-2 text-left text-[11px] font-medium text-[var(--color-text-muted)]">종목</th>
              <th className="pb-2 text-right text-[11px] font-medium text-[var(--color-text-muted)]">현재가</th>
              <th className="pb-2 text-right text-[11px] font-medium text-[var(--color-text-muted)]">등락률</th>
              <th className="hidden pb-2 text-right text-[11px] font-medium text-[var(--color-text-muted)] sm:table-cell">섹터</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock, i) => {
              const isUp = stock.changePercent >= 0
              return (
                <tr
                  key={stock.symbol}
                  className="border-b border-[var(--color-border-default)] last:border-0 transition-colors hover:bg-[var(--color-surface-50)]"
                >
                  <td className="py-2.5 text-xs text-[var(--color-text-muted)]">{i + 1}</td>
                  <td className="py-2.5">
                    <Link href={`/us-stocks/${stock.symbol}`} className="group">
                      <span className="font-medium text-[var(--color-text-primary)] group-hover:text-amber-600 transition-colors">
                        {stock.nameKr}
                      </span>
                      <span className="ml-1.5 font-mono text-[11px] text-[var(--color-text-muted)]">
                        {stock.symbol}
                      </span>
                    </Link>
                  </td>
                  <td className="py-2.5 text-right font-mono text-xs font-semibold tabular-nums">
                    {formatUSD(stock.price)}
                  </td>
                  <td className="py-2.5 text-right">
                    <span className={cn(
                      "inline-flex items-center gap-0.5 font-mono text-xs font-semibold tabular-nums",
                      isUp ? "text-[var(--color-gain)]" : "text-[var(--color-loss)]"
                    )}>
                      {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {isUp ? "+" : ""}{stock.changePercent.toFixed(2)}%
                    </span>
                  </td>
                  <td className="hidden py-2.5 text-right text-[11px] text-[var(--color-text-muted)] sm:table-cell">
                    {stock.sectorKr}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
