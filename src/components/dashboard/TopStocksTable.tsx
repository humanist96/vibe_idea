"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { ScoreBadge } from "@/components/ui/ScoreBadge"
import { PriceChange } from "@/components/ui/PriceChange"
import { TableRowSkeleton } from "@/components/ui/LoadingSkeleton"
import { formatCurrency, formatVolume } from "@/lib/utils/format"
import { Badge } from "@/components/ui/Badge"
import { ArrowRight } from "lucide-react"

interface StockRow {
  readonly ticker: string
  readonly name: string
  readonly price: number
  readonly change: number
  readonly changePercent: number
  readonly volume: number
  readonly aiScore: number | null
  readonly market: "KOSPI" | "KOSDAQ"
  readonly sector: string
}

export function TopStocksTable() {
  const [stocks, setStocks] = useState<StockRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/stocks")
        const json = await res.json()
        if (json.success) {
          setStocks(json.data)
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
    <Card>
      <CardHeader>
        <CardTitle>주요 종목</CardTitle>
        <Link
          href="/screener"
          className="group flex items-center gap-1 text-xs font-medium text-[var(--color-accent-400)] hover:text-[var(--color-accent-300)] transition-colors"
        >
          전체보기
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </CardHeader>

      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border-subtle)] text-left">
              <th className="pb-3 pr-4 text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
                #
              </th>
              <th className="pb-3 pr-4 text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
                종목
              </th>
              <th className="pb-3 pr-4 text-right text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
                현재가
              </th>
              <th className="pb-3 pr-4 text-right text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
                등락률
              </th>
              <th className="pb-3 pr-4 text-right text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
                거래량
              </th>
              <th className="pb-3 pr-4 text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
                시장
              </th>
              <th className="pb-3 text-center text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
                AI
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={7} className="py-1">
                    <TableRowSkeleton />
                  </td>
                </tr>
              ))
            ) : (
              stocks.slice(0, 20).map((stock, index) => (
                <tr
                  key={stock.ticker}
                  className="table-row-hover border-b border-[var(--color-border-subtle)]"
                >
                  <td className="py-3 pr-4 text-xs tabular-nums text-[var(--color-text-muted)]">
                    {index + 1}
                  </td>
                  <td className="py-3 pr-4">
                    <Link
                      href={`/stock/${stock.ticker}`}
                      className="group"
                    >
                      <p className="font-medium text-[var(--color-text-primary)] group-hover:text-[var(--color-accent-400)] transition-colors">
                        {stock.name}
                      </p>
                      <p className="font-mono text-[10px] text-[var(--color-text-muted)]">
                        {stock.ticker}
                      </p>
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-right font-mono text-sm tabular-nums font-medium text-[var(--color-text-primary)]">
                    {formatCurrency(stock.price)}
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <PriceChange
                      change={stock.change}
                      changePercent={stock.changePercent}
                      showIcon={false}
                      className="text-sm"
                    />
                  </td>
                  <td className="py-3 pr-4 text-right font-mono text-xs tabular-nums text-[var(--color-text-secondary)]">
                    {formatVolume(stock.volume)}
                  </td>
                  <td className="py-3 pr-4">
                    <Badge
                      variant={stock.market === "KOSPI" ? "blue" : "green"}
                    >
                      {stock.market}
                    </Badge>
                  </td>
                  <td className="py-3 text-center">
                    {stock.aiScore !== null ? (
                      <ScoreBadge score={stock.aiScore} size="sm" />
                    ) : (
                      <span className="text-[10px] text-[var(--color-text-muted)]">--</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
