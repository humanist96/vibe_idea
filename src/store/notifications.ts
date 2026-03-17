import { create } from "zustand"
import { persist } from "zustand/middleware"
import type {
  NotificationType,
  NotificationFilter,
  NotificationStats,
  Severity,
} from "@/lib/notifications/types"

export type { NotificationType } from "@/lib/notifications/types"

export interface Notification {
  readonly id: string
  readonly type: NotificationType
  readonly ticker: string
  readonly stockName: string
  readonly message: string
  readonly date: string
  readonly read: boolean
  readonly severity: Severity
  readonly alertRuleId: string | null
  readonly metadata: Record<string, unknown> | null
}

interface NotificationState {
  readonly notifications: readonly Notification[]
  readonly lastCheckedAt: string
  readonly filter: NotificationFilter
  readonly stats: NotificationStats | null

  addNotification: (n: Omit<Notification, "id" | "read">) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearAll: () => void
  unreadCount: () => number

  removeNotification: (id: string) => void
  setFilter: (filter: Partial<NotificationFilter>) => void
  resetFilter: () => void
  setStats: (stats: NotificationStats) => void
  getFilteredNotifications: () => readonly Notification[]
}

const DEFAULT_FILTER: NotificationFilter = {
  type: "all",
  severity: "all",
  ticker: null,
  onlyUnread: false,
}

const NOTIFICATION_LIMIT = 100

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      lastCheckedAt: new Date().toISOString(),
      filter: { ...DEFAULT_FILTER },
      stats: null,

      addNotification: (n) =>
        set((state) => ({
          notifications: [
            {
              ...n,
              id: `${n.ticker || "sys"}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              read: false,
            },
            ...state.notifications,
          ].slice(0, NOTIFICATION_LIMIT),
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

      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),

      setFilter: (partial) =>
        set((state) => ({
          filter: { ...state.filter, ...partial },
        })),

      resetFilter: () =>
        set({ filter: { ...DEFAULT_FILTER } }),

      setStats: (stats) =>
        set({ stats }),

      getFilteredNotifications: () => {
        const { notifications, filter } = get()
        return notifications.filter((n) => {
          if (filter.type !== "all" && n.type !== filter.type) return false
          if (filter.severity !== "all" && n.severity !== filter.severity) return false
          if (filter.ticker && n.ticker !== filter.ticker) return false
          if (filter.onlyUnread && n.read) return false
          return true
        })
      },
    }),
    {
      name: "korea-stock-ai-notifications",
      partialize: (state) => ({
        notifications: state.notifications,
        lastCheckedAt: state.lastCheckedAt,
      }),
    }
  )
)
