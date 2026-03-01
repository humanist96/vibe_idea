import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface RecentlyViewedStock {
  readonly ticker: string
  readonly name: string
  readonly viewedAt: number
}

interface RecentlyViewedState {
  readonly stocks: readonly RecentlyViewedStock[]
  addStock: (ticker: string, name: string) => void
  clearAll: () => void
}

const MAX_ITEMS = 20

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      stocks: [],
      addStock: (ticker, name) =>
        set((state) => {
          const filtered = state.stocks.filter((s) => s.ticker !== ticker)
          const updated = [
            { ticker, name, viewedAt: Date.now() },
            ...filtered,
          ].slice(0, MAX_ITEMS)
          return { stocks: updated }
        }),
      clearAll: () => set({ stocks: [] }),
    }),
    {
      name: "korea-stock-ai-recently-viewed",
    }
  )
)
