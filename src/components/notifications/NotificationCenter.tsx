"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { NotificationItem } from "./NotificationItem"

interface NotificationData {
  readonly id: string
  readonly ticker: string | null
  readonly type: string
  readonly message: string
  readonly read: boolean
  readonly createdAt: string
}

interface NotificationCenterProps {
  readonly onClose: () => void
  readonly onMarkAllRead: () => void
}

function groupByDate(
  items: readonly NotificationData[]
): { readonly today: readonly NotificationData[]; readonly earlier: readonly NotificationData[] } {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const today: NotificationData[] = []
  const earlier: NotificationData[] = []

  for (const item of items) {
    const itemDate = new Date(item.createdAt)
    if (itemDate >= todayStart) {
      today.push(item)
    } else {
      earlier.push(item)
    }
  }

  return { today, earlier }
}

export function NotificationCenter({
  onClose,
  onMarkAllRead,
}: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<
    readonly NotificationData[]
  >([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch("/api/notifications?limit=30")
        if (res.ok) {
          const data = await res.json()
          setNotifications(data.data ?? [])
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchNotifications()
  }, [])

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
        onMarkAllRead()
      }
    } catch {
      // Silently fail
    }
  }, [notifications, onMarkAllRead])

  const handleItemClick = useCallback(
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

  const { today, earlier } = groupByDate(notifications)
  const hasUnread = notifications.some((n) => !n.read)

  return (
    <div
      className={
        "absolute right-0 top-full mt-2 w-80 rounded-xl overflow-hidden " +
        "border border-[var(--color-border-default)] " +
        "bg-white shadow-lg shadow-black/8 animate-fade-in z-50"
      }
    >
      <div
        className={
          "flex items-center justify-between " +
          "border-b border-[var(--color-border-subtle)] px-4 py-3"
        }
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
          알림
        </span>
        {hasUnread && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className={
              "text-[10px] font-medium transition-colors " +
              "text-[var(--color-accent-500)] hover:text-[var(--color-accent-400)]"
            }
          >
            모두 읽음
          </button>
        )}
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-border-default)] border-t-[var(--color-accent-500)]" />
          </div>
        ) : notifications.length === 0 ? (
          <p className="px-4 py-8 text-center text-xs text-[var(--color-text-tertiary)]">
            알림이 없습니다
          </p>
        ) : (
          <>
            {today.length > 0 && (
              <div>
                <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                  오늘
                </p>
                {today.map((n) => (
                  <NotificationItem
                    key={n.id}
                    notification={n}
                    onClick={handleItemClick}
                  />
                ))}
              </div>
            )}
            {earlier.length > 0 && (
              <div>
                <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                  이전
                </p>
                {earlier.map((n) => (
                  <NotificationItem
                    key={n.id}
                    notification={n}
                    onClick={handleItemClick}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="border-t border-[var(--color-border-subtle)] px-4 py-2">
        <Link
          href="/my/notifications"
          onClick={onClose}
          className={
            "block text-center text-xs font-medium transition-colors " +
            "text-[var(--color-accent-500)] hover:text-[var(--color-accent-400)]"
          }
        >
          전체 알림 보기
        </Link>
      </div>
    </div>
  )
}
