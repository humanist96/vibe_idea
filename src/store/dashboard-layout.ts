import { create } from "zustand"
import { persist } from "zustand/middleware"
import { DEFAULT_CARD_ORDER } from "@/components/dashboard/card-registry"

interface DashboardLayoutState {
  readonly cardOrder: readonly string[]
  readonly hiddenCards: readonly string[]
  readonly isEditing: boolean
  readonly loaded: boolean
  setCardOrder: (order: readonly string[]) => void
  setHiddenCards: (hidden: readonly string[]) => void
  toggleCard: (cardId: string) => void
  moveCard: (fromIndex: number, toIndex: number) => void
  setEditing: (editing: boolean) => void
  resetToDefault: () => void
  loadFromServer: (order: readonly string[], hidden: readonly string[]) => void
}

export const useDashboardLayoutStore = create<DashboardLayoutState>()(
  persist(
    (set, get) => ({
      cardOrder: [...DEFAULT_CARD_ORDER],
      hiddenCards: [],
      isEditing: false,
      loaded: false,

      setCardOrder: (order) => set({ cardOrder: [...order] }),

      setHiddenCards: (hidden) => set({ hiddenCards: [...hidden] }),

      toggleCard: (cardId) => {
        const { hiddenCards, cardOrder } = get()
        if (hiddenCards.includes(cardId)) {
          set({
            hiddenCards: hiddenCards.filter((id) => id !== cardId),
            cardOrder: cardOrder.includes(cardId) ? cardOrder : [...cardOrder, cardId],
          })
        } else {
          set({ hiddenCards: [...hiddenCards, cardId] })
        }
      },

      moveCard: (fromIndex, toIndex) => {
        const { cardOrder } = get()
        const updated = [...cardOrder]
        const [moved] = updated.splice(fromIndex, 1)
        updated.splice(toIndex, 0, moved)
        set({ cardOrder: updated })
      },

      setEditing: (editing) => set({ isEditing: editing }),

      resetToDefault: () =>
        set({ cardOrder: [...DEFAULT_CARD_ORDER], hiddenCards: [] }),

      loadFromServer: (order, hidden) => {
        // Merge: add any new cards not in saved order
        const allIds = [...DEFAULT_CARD_ORDER]
        const merged = [...order]
        for (const id of allIds) {
          if (!merged.includes(id)) {
            merged.push(id)
          }
        }
        // Remove cards that no longer exist
        const validIds = new Set(allIds)
        const filtered = merged.filter((id) => validIds.has(id))
        set({ cardOrder: filtered, hiddenCards: [...hidden], loaded: true })
      },
    }),
    {
      name: "dashboard-layout",
      partialize: (state) => ({
        cardOrder: state.cardOrder,
        hiddenCards: state.hiddenCards,
      }),
    }
  )
)
