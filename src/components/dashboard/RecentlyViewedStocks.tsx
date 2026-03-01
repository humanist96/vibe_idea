"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { PriceChange } from "@/components/ui/PriceChange"
import { useRecentlyViewedStore } from "@/store/recently-viewed"
import { formatCurrency } from "@/lib/utils/format"
import { Clock } from "lucide-react"

interface StockPrice {
  readonly ticker: string
  readonly price: number
  readonly change: number
  readonly changePercent: number
}

export function RecentlyViewedStocks() {
  const recentStocks = useRecentlyViewedStore((s) => s.stocks)
  const [prices, setPrices] = useState<Map<string, StockPrice>>(new Map())
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const displayStocks = recentStocks.slice(0, 5)

  useEffect(() => {
    if (displayStocks.length === 0) return

    async function fetchPrices() {
      try {
        const results = await Promise.all(
          displayStocks.map(async (s) => {
            try {
              const res = await fetch(`/api/stocks/${s.ticker}`)
              const json = await res.json()
              if (json.success) {
                return {
                  ticker: s.ticker,
                  price: json.data.price ?? 0,
                  change: json.data.change ?? 0,
                  changePercent: json.data.changePercent ?? 0,
                } as StockPrice
              }
            } catch {
              // skip
            }
            return null
          })
        )

        const map = new Map<string, StockPrice>()
        for (const r of results) {
          if (r) map.set(r.ticker, r)
        }
        setPrices(map)
      } catch {
        // silently fail
      }
    }
    fetchPrices()
  }, [displayStocks.map((s) => s.ticker).join(",")]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!mounted || recentStocks.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            최근 본 종목
          </span>
        </CardTitle>
      </CardHeader>

      <div className="space-y-2">
        {displayStocks.map((stock) => {
          const priceData = prices.get(stock.ticker)
          return (
            <Link
              key={stock.ticker}
              href={`/stock/${stock.ticker}`}
              className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-[var(--color-glass-2)]"
            >
              <div>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  {stock.name}
                </p>
                <p className="font-mono text-[10px] text-[var(--color-text-muted)]">
                  {stock.ticker}
                </p>
              </div>
              <div className="text-right">
                {priceData ? (
                  <>
                    <p className="font-mono text-sm tabular-nums font-medium text-[var(--color-text-primary)]">
                      {formatCurrency(priceData.price)}
                    </p>
                    <PriceChange
                      change={priceData.change}
                      changePercent={priceData.changePercent}
                      showIcon={false}
                    />
                  </>
                ) : (
                  <p className="text-xs text-[var(--color-text-muted)]">--</p>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </Card>
  )
}
