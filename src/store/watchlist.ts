import { create } from "zustand"
import { persist } from "zustand/middleware"

interface WatchlistState {
  readonly tickers: string[]
  addTicker: (ticker: string) => void
  removeTicker: (ticker: string) => void
  isInWatchlist: (ticker: string) => boolean
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      tickers: [],
      addTicker: (ticker) =>
        set((state) => {
          if (state.tickers.includes(ticker)) return state
          return { tickers: [...state.tickers, ticker] }
        }),
      removeTicker: (ticker) =>
        set((state) => ({
          tickers: state.tickers.filter((t) => t !== ticker),
        })),
      isInWatchlist: (ticker) => get().tickers.includes(ticker),
    }),
    {
      name: "korea-stock-ai-watchlist",
    }
  )
)
