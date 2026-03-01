import { create } from "zustand"
import { persist } from "zustand/middleware"

interface ScreenerDefaultsState {
  readonly lastFilters: Record<string, string>
  readonly lastSort: string
  readonly lastOrder: "asc" | "desc"
  saveDefaults: (
    filters: Record<string, string>,
    sort: string,
    order: "asc" | "desc"
  ) => void
}

export const useScreenerDefaultsStore = create<ScreenerDefaultsState>()(
  persist(
    (set) => ({
      lastFilters: {},
      lastSort: "marketCap",
      lastOrder: "desc",
      saveDefaults: (filters, sort, order) =>
        set({
          lastFilters: { ...filters },
          lastSort: sort,
          lastOrder: order,
        }),
    }),
    {
      name: "korea-stock-ai-screener-defaults",
    }
  )
)
