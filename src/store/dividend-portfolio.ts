import { create } from "zustand"
import { persist } from "zustand/middleware"
import type {
  DividendPortfolioItem,
  DividendPortfolioSettings,
  DividendMarket,
} from "@/lib/dividend/dividend-types"

type ActiveTab = "screener" | "designer" | "calendar"

interface DividendPortfolioState {
  readonly activeTab: ActiveTab
  readonly settings: DividendPortfolioSettings
  readonly items: readonly DividendPortfolioItem[]
  readonly savedPortfolioId: string | null
  readonly savedPortfolioName: string | null

  setActiveTab: (tab: ActiveTab) => void
  setSettings: (updates: Partial<DividendPortfolioSettings>) => void

  addItem: (item: DividendPortfolioItem) => void
  removeItem: (ticker: string, market: DividendMarket) => void
  updateWeight: (ticker: string, market: DividendMarket, weight: number) => void
  reorderItems: (items: readonly DividendPortfolioItem[]) => void
  clearAll: () => void

  distributeEqual: () => void
  distributeByYield: (yields: ReadonlyMap<string, number>) => void
  distributeByMarketCap: (marketCaps: ReadonlyMap<string, number>) => void

  loadFromSaved: (
    id: string,
    name: string,
    settings: DividendPortfolioSettings,
    items: readonly DividendPortfolioItem[]
  ) => void
  setSavedId: (id: string | null, name: string | null) => void
}

const DEFAULT_SETTINGS: DividendPortfolioSettings = {
  totalAmount: 5000,
  period: 10,
  drip: true,
  monthlyAdd: 50,
  dividendGrowthRate: 3,
}

function normalizeWeights(
  items: readonly DividendPortfolioItem[],
  changedTicker: string,
  changedMarket: DividendMarket,
  newWeight: number
): readonly DividendPortfolioItem[] {
  const others = items.filter(
    (i) => !(i.ticker === changedTicker && i.market === changedMarket)
  )
  const remaining = Math.max(0, 100 - newWeight)
  const othersTotal = others.reduce((sum, i) => sum + i.weight, 0)

  return items.map((item) => {
    if (item.ticker === changedTicker && item.market === changedMarket) {
      return { ...item, weight: newWeight }
    }
    if (othersTotal === 0) {
      return { ...item, weight: remaining / others.length }
    }
    return { ...item, weight: (item.weight / othersTotal) * remaining }
  })
}

export const useDividendPortfolioStore = create<DividendPortfolioState>()(
  persist(
    (set, get) => ({
      activeTab: "screener",
      settings: DEFAULT_SETTINGS,
      items: [],
      savedPortfolioId: null,
      savedPortfolioName: null,

      setActiveTab: (tab) => set({ activeTab: tab }),

      setSettings: (updates) =>
        set((state) => ({
          settings: { ...state.settings, ...updates },
        })),

      addItem: (item) =>
        set((state) => {
          const exists = state.items.some(
            (i) => i.ticker === item.ticker && i.market === item.market
          )
          if (exists) return state

          const newItems = [...state.items, item]
          const equalWeight = 100 / newItems.length
          return {
            items: newItems.map((i) => ({ ...i, weight: equalWeight })),
          }
        }),

      removeItem: (ticker, market) =>
        set((state) => {
          const filtered = state.items.filter(
            (i) => !(i.ticker === ticker && i.market === market)
          )
          if (filtered.length === 0) return { items: [] }
          const equalWeight = 100 / filtered.length
          return {
            items: filtered.map((i) => ({ ...i, weight: equalWeight })),
          }
        }),

      updateWeight: (ticker, market, weight) =>
        set((state) => ({
          items: normalizeWeights(state.items, ticker, market, weight),
        })),

      reorderItems: (items) => set({ items }),

      clearAll: () =>
        set({
          items: [],
          savedPortfolioId: null,
          savedPortfolioName: null,
        }),

      distributeEqual: () =>
        set((state) => {
          if (state.items.length === 0) return state
          const w = 100 / state.items.length
          return { items: state.items.map((i) => ({ ...i, weight: w })) }
        }),

      distributeByYield: (yields) =>
        set((state) => {
          if (state.items.length === 0) return state
          const totalYield = state.items.reduce(
            (sum, i) => sum + (yields.get(`${i.market}:${i.ticker}`) ?? 0),
            0
          )
          if (totalYield === 0) {
            const w = 100 / state.items.length
            return { items: state.items.map((i) => ({ ...i, weight: w })) }
          }
          return {
            items: state.items.map((i) => ({
              ...i,
              weight:
                ((yields.get(`${i.market}:${i.ticker}`) ?? 0) / totalYield) *
                100,
            })),
          }
        }),

      distributeByMarketCap: (marketCaps) =>
        set((state) => {
          if (state.items.length === 0) return state
          const totalCap = state.items.reduce(
            (sum, i) => sum + (marketCaps.get(`${i.market}:${i.ticker}`) ?? 0),
            0
          )
          if (totalCap === 0) {
            const w = 100 / state.items.length
            return { items: state.items.map((i) => ({ ...i, weight: w })) }
          }
          return {
            items: state.items.map((i) => ({
              ...i,
              weight:
                ((marketCaps.get(`${i.market}:${i.ticker}`) ?? 0) / totalCap) *
                100,
            })),
          }
        }),

      loadFromSaved: (id, name, settings, items) =>
        set({
          savedPortfolioId: id,
          savedPortfolioName: name,
          settings,
          items,
        }),

      setSavedId: (id, name) =>
        set({ savedPortfolioId: id, savedPortfolioName: name }),
    }),
    {
      name: "dividend-lab-portfolio",
    }
  )
)
