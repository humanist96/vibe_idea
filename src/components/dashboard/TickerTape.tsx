"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

interface TickerStock {
  readonly ticker: string
  readonly name: string
  readonly price: number
  readonly changePercent: number
}

const REFRESH_INTERVAL = 5 * 60 * 1000 // 5분

export function TickerTape() {
  const [stocks, setStocks] = useState<TickerStock[]>([])

  useEffect(() => {
    async function fetchStocks() {
      try {
        const res = await fetch("/api/stocks")
        const json = await res.json()
        if (json.success && json.data) {
          setStocks(
            json.data.slice(0, 20).map((s: Record<string, unknown>) => ({
              ticker: s.ticker as string,
              name: s.name as string,
              price: s.price as number,
              changePercent: s.changePercent as number,
            }))
          )
        }
      } catch {
        // silently fail
      }
    }

    fetchStocks()
    const timer = setInterval(fetchStocks, REFRESH_INTERVAL)
    return () => clearInterval(timer)
  }, [])

  if (stocks.length === 0) return null

  const formatPrice = (price: number) => {
    if (price >= 1e6) return `${(price / 1e4).toFixed(0)}만`
    return price.toLocaleString("ko-KR")
  }

  const renderItems = (key: string) =>
    stocks.map((stock) => (
      <Link
        key={`${key}-${stock.ticker}`}
        href={`/stock/${stock.ticker}`}
        className="inline-flex shrink-0 items-center gap-1.5 px-3 transition-opacity hover:opacity-70"
      >
        <span className="text-xs font-medium text-[var(--color-text-primary)]">
          {stock.name}
        </span>
        <span className="text-xs tabular-nums text-[var(--color-text-secondary)]">
          {formatPrice(stock.price)}
        </span>
        <span
          className="text-xs font-semibold tabular-nums"
          style={{
            color:
              stock.changePercent > 0
                ? "var(--color-gain)"
                : stock.changePercent < 0
                  ? "var(--color-loss)"
                  : "var(--color-text-muted)",
          }}
        >
          {stock.changePercent > 0 ? "+" : ""}
          {stock.changePercent.toFixed(2)}%
        </span>
        <span className="text-[var(--color-border-default)]">·</span>
      </Link>
    ))

  return (
    <div className="ticker-tape-container relative overflow-hidden">
      {/* 좌우 페이드 그라디언트 */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-white to-transparent" />

      <div className="ticker-tape-track flex items-center whitespace-nowrap py-1.5">
        <div className="ticker-tape-content flex shrink-0 items-center">
          {renderItems("a")}
        </div>
        <div className="ticker-tape-content flex shrink-0 items-center" aria-hidden="true">
          {renderItems("b")}
        </div>
      </div>
    </div>
  )
}
