"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Card } from "@/components/ui/Card"
import { PriceChange } from "@/components/ui/PriceChange"
import { Badge } from "@/components/ui/Badge"
import { AddToWatchlist } from "@/components/watchlist/AddToWatchlist"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { useWatchlistStore } from "@/store/watchlist"
import { useUSWatchlistStore } from "@/store/us-watchlist"
import { useMarketMode } from "@/store/market-mode"
import { formatCurrency } from "@/lib/utils/format"
import { EmptyWatchlist } from "@/components/ui/EmptyWatchlist"
import { Lock, Search } from "lucide-react"

interface StockData {
  readonly ticker: string
  readonly name: string
  readonly price: number
  readonly change: number
  readonly changePercent: number
  readonly market: "KOSPI" | "KOSDAQ"
  readonly sector: string
}

interface USStockData {
  readonly symbol: string
  readonly name: string
  readonly nameKr: string
  readonly price: number
  readonly change: number
  readonly changePercent: number
  readonly sector: string
  readonly exchange: string
}

export default function WatchlistPage() {
  const { status } = useSession()
  const { mode } = useMarketMode()
  const krTickers = useWatchlistStore((s) => s.tickers)
  const usTickers = useUSWatchlistStore((s) => s.tickers)

  const tickers = mode === "us" ? usTickers : krTickers
  const isUS = mode === "us"

  const [krStocks, setKrStocks] = useState<StockData[]>([])
  const [usStocks, setUsStocks] = useState<USStockData[]>([])
  const [loading, setLoading] = useState(true)

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-accent-500)]/30 border-t-[var(--color-accent-500)]" />
      </div>
    )
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex flex-col items-center py-20">
        <Lock className="mb-4 h-10 w-10 text-[var(--color-text-muted)]" />
        <p className="text-sm font-medium text-[var(--color-text-secondary)]">
          로그인이 필요한 서비스입니다
        </p>
        <p className="mt-2 text-xs text-[var(--color-text-tertiary)] text-center max-w-xs">
          로그인 후 스크리너에서 관심종목을 추가하고<br />
          맞춤 분석 보고서를 받아보세요
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-accent-500)] px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-[var(--color-accent-600)]"
          >
            로그인하기
          </Link>
          <Link
            href="/screener"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border-default)] px-5 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-all hover:bg-[var(--color-surface-50)]"
          >
            <Search className="h-4 w-4" />
            스크리너 둘러보기
          </Link>
        </div>
      </div>
    )
  }

  useEffect(() => {
    async function fetchData() {
      if (tickers.length === 0) {
        setKrStocks([])
        setUsStocks([])
        setLoading(false)
        return
      }

      try {
        if (isUS) {
          const results = await Promise.all(
            tickers.map(async (ticker) => {
              try {
                const res = await fetch(`/api/us-stocks/${ticker}`)
                const json = await res.json()
                if (json.success) {
                  const d = json.data
                  const q = d.quote ?? {}
                  return {
                    symbol: d.symbol,
                    name: d.name,
                    nameKr: d.nameKr ?? d.name,
                    price: q.price ?? 0,
                    change: q.change ?? 0,
                    changePercent: q.changePercent ?? 0,
                    sector: d.sector ?? "",
                    exchange: d.exchange ?? "",
                  } as USStockData
                }
                return null
              } catch {
                return null
              }
            })
          )
          setUsStocks(results.filter((s): s is USStockData => s !== null))
        } else {
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
          setKrStocks(results.filter((s): s is StockData => s !== null))
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }

    setLoading(true)
    fetchData()
  }, [tickers, isUS])

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          관심종목
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
          관심 등록한 {isUS ? "해외" : "국내"} 종목 모아보기 ({tickers.length}개)
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
          <EmptyWatchlist />
        </Card>
      ) : isUS ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {usStocks.map((stock, i) => (
            <Card
              key={stock.symbol}
              className={`animate-fade-up glass-card-hover stagger-${Math.min(i + 1, 6)}`}
            >
              <div className="flex items-start justify-between">
                <Link href={`/us-stocks/${stock.symbol}`} className="group flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-[var(--color-text-primary)] group-hover:text-[var(--color-accent-400)] transition-colors">
                      {stock.nameKr}
                    </p>
                    <Badge variant="blue">
                      {stock.exchange}
                    </Badge>
                  </div>
                  <p className="mt-0.5 font-mono text-[10px] text-[var(--color-text-muted)]">
                    {stock.symbol}
                  </p>
                </Link>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-display text-xl font-bold tabular-nums text-[var(--color-text-primary)]">
                  ${stock.price.toFixed(2)}
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
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {krStocks.map((stock, i) => (
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
