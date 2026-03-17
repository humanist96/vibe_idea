import { create } from "zustand"

export type ToastType =
  | "success"
  | "error"
  | "info"
  | "price_surge"
  | "price_drop"
  | "market_alert"
  | "earnings_alert"
  | "breakout_resistance"
  | "breakdown_support"
  | "earnings_surprise"
  | "foreign_bulk_buy"
  | "institution_bulk_buy"

export interface ToastItem {
  readonly id: string
  readonly type: ToastType
  readonly message: string
  readonly ticker?: string
}

interface ToastState {
  readonly toasts: readonly ToastItem[]
  addToast: (toast: Omit<ToastItem, "id">) => void
  removeToast: (id: string) => void
}

const MAX_TOASTS = 5

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],

  addToast: (toast) =>
    set((state) => ({
      toasts: [
        { ...toast, id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` },
        ...state.toasts,
      ].slice(0, MAX_TOASTS),
    })),

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}))
