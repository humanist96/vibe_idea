"use client"

import { Star } from "lucide-react"
import { useWatchlistStore } from "@/store/watchlist"
import { cn } from "@/lib/utils/cn"

interface AddToWatchlistProps {
  readonly ticker: string
  readonly className?: string
}

export function AddToWatchlist({ ticker, className }: AddToWatchlistProps) {
  const { isInWatchlist, addTicker, removeTicker } = useWatchlistStore()
  const watched = isInWatchlist(ticker)

  const toggle = () => {
    if (watched) {
      removeTicker(ticker)
    } else {
      addTicker(ticker)
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "rounded-lg p-1.5 transition-colors hover:bg-gray-100",
        className
      )}
      title={watched ? "관심종목에서 제거" : "관심종목에 추가"}
    >
      <Star
        className={cn(
          "h-4 w-4",
          watched
            ? "fill-yellow-400 text-yellow-400"
            : "text-gray-400"
        )}
      />
    </button>
  )
}
