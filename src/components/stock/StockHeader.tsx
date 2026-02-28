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
    <div className="flex items-start justify-between animate-fade-up">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">
            {name}
          </h1>
          <span className="font-mono text-sm text-[var(--color-text-muted)]">
            {ticker}
          </span>
          <Badge variant={market === "KOSPI" ? "blue" : "green"}>
            {market}
          </Badge>
          {sector && <Badge variant="gray">{sector}</Badge>}
        </div>
        <div className="mt-2 flex items-baseline gap-3">
          <span className="font-display text-3xl font-bold tabular-nums text-[var(--color-text-primary)]">
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
        className="rounded-xl p-2.5 transition-colors hover:bg-[var(--color-surface-100)]"
        title={watched ? "관심종목에서 제거" : "관심종목에 추가"}
      >
        <Star
          className={`h-6 w-6 transition-colors ${
            watched
              ? "fill-amber-400 text-amber-400"
              : "text-[var(--color-text-muted)]"
          }`}
        />
      </button>
    </div>
  )
}
