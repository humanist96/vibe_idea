"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { PriceChange } from "@/components/ui/PriceChange"
import { Badge } from "@/components/ui/Badge"
import { AddToWatchlist } from "@/components/watchlist/AddToWatchlist"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { useWatchlistStore } from "@/store/watchlist"
import { formatCurrency } from "@/lib/utils/format"
import { Star } from "lucide-react"

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">관심종목</h1>
        <p className="mt-1 text-sm text-gray-500">
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
        <Card>
          <div className="flex flex-col items-center gap-3 py-12">
            <Star className="h-12 w-12 text-gray-300" />
            <p className="text-gray-500">관심종목이 없습니다.</p>
            <p className="text-sm text-gray-400">
              종목 페이지에서 별표를 클릭하여 관심종목에 추가하세요.
            </p>
            <Link
              href="/screener"
              className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              스크리너에서 종목 찾기 →
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stocks.map((stock) => (
            <Card key={stock.ticker}>
              <div className="flex items-start justify-between">
                <Link href={`/stock/${stock.ticker}`} className="group flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 group-hover:text-blue-600">
                      {stock.name}
                    </p>
                    <Badge
                      variant={stock.market === "KOSPI" ? "blue" : "green"}
                    >
                      {stock.market}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {stock.ticker}
                  </p>
                </Link>
                <AddToWatchlist ticker={stock.ticker} />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-xl font-bold text-gray-900">
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
