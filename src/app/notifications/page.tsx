"use client"

import { useState, useEffect, useCallback } from "react"
import { Bell, Settings, CheckCheck } from "lucide-react"
import { NotificationItem } from "@/components/notifications/NotificationItem"
import { AlertRuleList } from "@/components/notifications/AlertRuleList"

interface NotificationData {
  readonly id: string
  readonly ticker: string | null
  readonly type: string
  readonly message: string
  readonly read: boolean
  readonly createdAt: string
}

type TabType = "notifications" | "rules"

export default function NotificationsPage() {
  const [tab, setTab] = useState<TabType>("notifications")
  const [notifications, setNotifications] = useState<
    readonly NotificationData[]
  >([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=100")
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.data ?? [])
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (tab === "notifications") {
      fetchNotifications()
    }
  }, [tab, fetchNotifications])

  const handleMarkRead = useCallback(
    async (id: string) => {
      try {
        await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: [id] }),
        })
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        )
      } catch {
        // Silently fail
      }
    },
    []
  )

  const handleMarkAllRead = useCallback(async () => {
    const unreadIds = notifications
      .filter((n) => !n.read)
      .map((n) => n.id)

    if (unreadIds.length === 0) return

    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: unreadIds }),
      })

      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, read: true }))
        )
      }
    } catch {
      // Silently fail
    }
  }, [notifications])

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-lg font-bold text-[var(--color-text-primary)]">
          <Bell className="h-5 w-5" />
          알림 센터
        </h1>
        {tab === "notifications" && unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className={
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium " +
              "text-[var(--color-accent-500)] transition-colors " +
              "hover:bg-[var(--color-surface-100)]"
            }
          >
            <CheckCheck className="h-3.5 w-3.5" />
            모두 읽음
          </button>
        )}
      </div>

      <div className="mb-4 flex gap-1 rounded-xl bg-[var(--color-surface-100)] p-1">
        <button
          type="button"
          onClick={() => setTab("notifications")}
          className={
            "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 " +
            "text-sm font-medium transition-colors " +
            (tab === "notifications"
              ? "bg-white text-[var(--color-text-primary)] shadow-sm"
              : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]")
          }
        >
          <Bell className="h-4 w-4" />
          알림
          {unreadCount > 0 && (
            <span
              className={
                "ml-1 flex h-4 min-w-4 items-center justify-center rounded-full " +
                "bg-red-500 px-1 text-[10px] font-bold text-white"
              }
            >
              {unreadCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab("rules")}
          className={
            "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 " +
            "text-sm font-medium transition-colors " +
            (tab === "rules"
              ? "bg-white text-[var(--color-text-primary)] shadow-sm"
              : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]")
          }
        >
          <Settings className="h-4 w-4" />
          알림 규칙
        </button>
      </div>

      {tab === "notifications" && (
        <div
          className={
            "rounded-xl border border-[var(--color-border-default)] " +
            "bg-white overflow-hidden"
          }
        >
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-border-default)] border-t-[var(--color-accent-500)]" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <Bell className="mx-auto h-8 w-8 text-[var(--color-text-muted)]" />
              <p className="mt-3 text-sm text-[var(--color-text-tertiary)]">
                알림이 없습니다
              </p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                알림 규칙을 설정하면 조건 충족 시 알림을 받을 수 있습니다
              </p>
              <button
                type="button"
                onClick={() => setTab("rules")}
                className={
                  "mt-4 inline-flex items-center gap-1.5 rounded-lg " +
                  "bg-[var(--color-accent-500)] px-4 py-2 text-sm font-medium " +
                  "text-white transition-colors hover:bg-[var(--color-accent-600)]"
                }
              >
                <Settings className="h-4 w-4" />
                알림 규칙 설정
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-border-subtle)]">
              {notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onClick={handleMarkRead}
                  showDate
                />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "rules" && <AlertRuleList />}
    </div>
  )
}
