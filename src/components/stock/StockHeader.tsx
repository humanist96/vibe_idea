"use client"

import { PriceChange } from "@/components/ui/PriceChange"
import { Badge } from "@/components/ui/Badge"
import { formatCurrency } from "@/lib/utils/format"
import { Star } from "lucide-react"
import { useWatchlistStore } from "@/store/watchlist"

interface StockHeaderProps {
  readonly ticker: string
  readonly name: string
  readonly price: number
  readonly change: number
  readonly changePercent: number
  readonly market: "KOSPI" | "KOSDAQ"
  readonly sector: string
}

export function StockHeader({
  ticker,
  name,
  price,
  change,
  changePercent,
  market,
  sector,
}: StockHeaderProps) {
  const { isInWatchlist, addTicker, removeTicker } = useWatchlistStore()
  const watched = isInWatchlist(ticker)

  const toggleWatchlist = () => {
    if (watched) {
      removeTicker(ticker)
    } else {
      addTicker(ticker)
    }
  }

  return (
    <div className="flex items-start justify-between">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
          <span className="font-mono text-sm text-gray-400">{ticker}</span>
          <Badge variant={market === "KOSPI" ? "blue" : "green"}>
            {market}
          </Badge>
          <Badge variant="gray">{sector}</Badge>
        </div>
        <div className="mt-2 flex items-baseline gap-3">
          <span className="text-3xl font-bold text-gray-900">
            {formatCurrency(price)}
          </span>
          <PriceChange
            change={change}
            changePercent={changePercent}
            className="text-lg"
          />
        </div>
      </div>
      <button
        type="button"
        onClick={toggleWatchlist}
        className="rounded-lg p-2 transition-colors hover:bg-gray-100"
        title={watched ? "관심종목에서 제거" : "관심종목에 추가"}
      >
        <Star
          className={`h-6 w-6 ${
            watched
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-400"
          }`}
        />
      </button>
    </div>
  )
}
