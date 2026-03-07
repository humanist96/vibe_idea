import { create } from "zustand"
import { persist } from "zustand/middleware"

export type NotificationType = "price_surge" | "price_drop" | "market_alert" | "earnings_alert"

export interface Notification {
  readonly id: string
  readonly type: NotificationType
  readonly ticker: string
  readonly stockName: string
  readonly message: string
  readonly date: string
  readonly read: boolean
}

interface NotificationState {
  readonly notifications: Notification[]
  readonly lastCheckedAt: string
  addNotification: (n: Omit<Notification, "id" | "read">) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearAll: () => void
  unreadCount: () => number
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      lastCheckedAt: new Date().toISOString(),

      addNotification: (n) =>
        set((state) => ({
          notifications: [
            { ...n, id: `${n.ticker}-${Date.now()}`, read: false },
            ...state.notifications,
          ].slice(0, 50),
        })),

      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),

      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          lastCheckedAt: new Date().toISOString(),
        })),

      clearAll: () =>
        set({
          notifications: [],
          lastCheckedAt: new Date().toISOString(),
        }),

      unreadCount: () =>
        get().notifications.filter((n) => !n.read).length,
    }),
    {
      name: "korea-stock-ai-notifications",
    }
  )
)
