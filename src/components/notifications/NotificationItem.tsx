"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"

interface NotificationData {
  readonly id: string
  readonly ticker: string | null
  readonly type: string
  readonly message: string
  readonly read: boolean
  readonly createdAt: string
}

interface NotificationItemProps {
  readonly notification: NotificationData
  readonly onClick: (id: string) => void
  readonly showDate?: boolean
}

const dotColorMap: Record<string, string> = {
  PRICE_ABOVE: "bg-emerald-500",
  PRICE_BELOW: "bg-[var(--color-loss)]",
  VOLUME_SPIKE: "bg-orange-500",
  EARNINGS_DATE: "bg-blue-500",
  price_surge: "bg-emerald-500",
  price_drop: "bg-[var(--color-loss)]",
  market_alert: "bg-orange-500",
  earnings_alert: "bg-blue-500",
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return "방금"
  if (diffMin < 60) return `${diffMin}분 전`

  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}시간 전`

  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 7) return `${diffDay}일 전`

  return date.toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  })
}

export function NotificationItem({
  notification,
  onClick,
  showDate = false,
}: NotificationItemProps) {
  const router = useRouter()

  const handleClick = useCallback(() => {
    onClick(notification.id)
    if (notification.ticker) {
      router.push(`/stock/${notification.ticker}`)
    }
  }, [notification.id, notification.ticker, onClick, router])

  const dotColor = dotColorMap[notification.type] ?? "bg-gray-400"

  return (
    <button
      type="button"
      onClick={handleClick}
      className={
        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors " +
        "hover:bg-[var(--color-surface-50)] " +
        (notification.read ? "" : "bg-[var(--color-surface-50)]/50")
      }
    >
      <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${dotColor}`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-[var(--color-text-primary)]">
          {notification.message}
        </p>
        <p className="mt-0.5 text-[10px] text-[var(--color-text-tertiary)]">
          {notification.ticker && `${notification.ticker} · `}
          {showDate
            ? new Date(notification.createdAt).toLocaleDateString("ko-KR", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : formatRelativeTime(notification.createdAt)}
        </p>
      </div>
      {!notification.read && (
        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent-400)]" />
      )}
    </button>
  )
}
