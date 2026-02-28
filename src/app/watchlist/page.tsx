"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/Card"
import { PriceChange } from "@/components/ui/PriceChange"
import { Badge } from "@/components/ui/Badge"
import { AddToWatchlist } from "@/components/watchlist/AddToWatchlist"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { useWatchlistStore } from "@/store/watchlist"
import { formatCurrency } from "@/lib/utils/format"
import { Star, ArrowRight } from "lucide-react"

interface StockData {
  readonly ticker: string
  readonly name: string
  readonly price: number
  readonly change: number
  readonly changePercent: number
  readonly market: "KOSPI" | "KOSDAQ"
  readonly sector: string
}

export default function WatchlistPage() {
  const { tickers } = useWatchlistStore()
  const [stocks, setStocks] = useState<StockData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      if (tickers.length === 0) {
        setStocks([])
        setLoading(false)
        return
      }

      try {
        const results = await Promise.all(
          tickers.map(async (ticker) => {
            try {
              const res = await fetch(`/api/stocks/${ticker}`)
              const json = await res.json()
              if (json.success) return json.data as StockData
              return null
            } catch {
              return null
            }
          })
        )

        setStocks(results.filter((s): s is StockData => s !== null))
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [tickers])

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          관심종목
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
          관심 등록한 종목 모아보기 ({tickers.length}개)
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : tickers.length === 0 ? (
        <Card className="animate-fade-up stagger-2">
          <div className="flex flex-col items-center gap-3 py-16">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-glass-2)]">
              <Star className="h-7 w-7 text-[var(--color-text-muted)]" />
            </div>
            <p className="text-sm text-[var(--color-text-secondary)]">
              관심종목이 없습니다.
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              종목 페이지에서 별표를 클릭하여 추가하세요.
            </p>
            <Link
              href="/screener"
              className="group mt-2 flex items-center gap-1 text-sm font-medium text-[var(--color-accent-400)] hover:text-[var(--color-accent-300)] transition-colors"
            >
              스크리너에서 종목 찾기
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stocks.map((stock, i) => (
            <Card
              key={stock.ticker}
              className={`animate-fade-up glass-card-hover stagger-${Math.min(i + 1, 6)}`}
            >
              <div className="flex items-start justify-between">
                <Link href={`/stock/${stock.ticker}`} className="group flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-[var(--color-text-primary)] group-hover:text-[var(--color-accent-400)] transition-colors">
                      {stock.name}
                    </p>
                    <Badge
                      variant={stock.market === "KOSPI" ? "blue" : "green"}
                    >
                      {stock.market}
                    </Badge>
                  </div>
                  <p className="mt-0.5 font-mono text-[10px] text-[var(--color-text-muted)]">
                    {stock.ticker}
                  </p>
                </Link>
                <AddToWatchlist ticker={stock.ticker} />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-display text-xl font-bold tabular-nums text-[var(--color-text-primary)]">
                  {formatCurrency(stock.price)}
                </span>
                <PriceChange
                  change={stock.change}
                  changePercent={stock.changePercent}
                  className="text-sm"
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
