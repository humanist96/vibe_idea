import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface PortfolioItem {
  readonly ticker: string
  readonly market: "KR" | "US"
  readonly name: string
  readonly sectorKr: string
  readonly quantity: number
  readonly avgPrice: number
  readonly addedAt: number
}

interface PortfolioState {
  readonly items: readonly PortfolioItem[]
  addItem: (item: Omit<PortfolioItem, "addedAt">) => void
  updateItem: (ticker: string, updates: Partial<Pick<PortfolioItem, "quantity" | "avgPrice">>) => void
  removeItem: (ticker: string) => void
  isInPortfolio: (ticker: string) => boolean
}

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          if (state.items.some((i) => i.ticker === item.ticker)) return state
          return {
            items: [...state.items, { ...item, addedAt: Date.now() }],
          }
        }),

      updateItem: (ticker, updates) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.ticker === ticker ? { ...item, ...updates } : item
          ),
        })),

      removeItem: (ticker) =>
        set((state) => ({
          items: state.items.filter((i) => i.ticker !== ticker),
        })),

      isInPortfolio: (ticker) =>
        get().items.some((i) => i.ticker === ticker),
    }),
    {
      name: "korea-stock-ai-portfolio",
    }
  )
)
