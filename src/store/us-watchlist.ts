import { create } from "zustand"
import { persist } from "zustand/middleware"

interface USWatchlistState {
  readonly tickers: string[]
  addTicker: (ticker: string) => void
  removeTicker: (ticker: string) => void
  isInWatchlist: (ticker: string) => boolean
}

export const useUSWatchlistStore = create<USWatchlistState>()(
  persist(
    (set, get) => ({
      tickers: [],
      addTicker: (ticker) =>
        set((state) => {
          const upper = ticker.toUpperCase()
          if (state.tickers.includes(upper)) return state
          return { tickers: [...state.tickers, upper] }
        }),
      removeTicker: (ticker) =>
        set((state) => ({
          tickers: state.tickers.filter((t) => t !== ticker.toUpperCase()),
        })),
      isInWatchlist: (ticker) => get().tickers.includes(ticker.toUpperCase()),
    }),
    {
      name: "us-stock-watchlist",
    }
  )
)
