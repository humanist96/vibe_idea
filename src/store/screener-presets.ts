import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface FilterPreset {
  readonly id: string
  readonly name: string
  readonly filters: Record<string, string>
  readonly createdAt: number
}

interface ScreenerPresetsState {
  readonly presets: readonly FilterPreset[]
  addPreset: (name: string, filters: Record<string, string>) => void
  removePreset: (id: string) => void
}

export const useScreenerPresetsStore = create<ScreenerPresetsState>()(
  persist(
    (set) => ({
      presets: [],
      addPreset: (name, filters) =>
        set((state) => ({
          presets: [
            ...state.presets,
            {
              id: `preset-${Date.now()}`,
              name,
              filters,
              createdAt: Date.now(),
            },
          ],
        })),
      removePreset: (id) =>
        set((state) => ({
          presets: state.presets.filter((p) => p.id !== id),
        })),
    }),
    {
      name: "korea-stock-ai-screener-presets",
    }
  )
)
