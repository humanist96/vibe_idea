"use client"

import { useState, useCallback, useEffect } from "react"
import { Toast } from "./Toast"
import { useNotificationStore } from "@/store/notifications"
import type { Notification } from "@/store/notifications"

const MAX_TOASTS = 5

export function ToastContainer() {
  const [toasts, setToasts] = useState<Notification[]>([])
  const notifications = useNotificationStore((s) => s.notifications)

  useEffect(() => {
    if (notifications.length === 0) return
    const latest = notifications[0]
    if (!latest || latest.read) return

    setToasts((prev) => {
      if (prev.some((t) => t.id === latest.id)) return prev
      return [latest, ...prev].slice(0, MAX_TOASTS)
    })
  }, [notifications])

  const handleDismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed right-4 top-20 z-50 flex w-80 flex-col gap-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          ticker={toast.ticker}
          message={toast.message}
          onDismiss={handleDismiss}
        />
      ))}
    </div>
  )
}
