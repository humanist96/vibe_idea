import { create } from "zustand"
import { persist } from "zustand/middleware"

export type MarketMode = "kr" | "us"

interface MarketModeState {
  readonly mode: MarketMode
  readonly setMode: (mode: MarketMode) => void
  readonly toggle: () => void
}

export const useMarketMode = create<MarketModeState>()(
  persist(
    (set) => ({
      mode: "kr",
      setMode: (mode) => set({ mode }),
      toggle: () => set((s) => ({ mode: s.mode === "kr" ? "us" : "kr" })),
    }),
    { name: "market-mode" }
  )
)
