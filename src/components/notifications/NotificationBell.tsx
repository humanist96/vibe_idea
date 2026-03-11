"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Bell } from "lucide-react"
import { NotificationCenter } from "./NotificationCenter"

interface NotificationBellProps {
  readonly className?: string
}

export function NotificationBell({ className }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?read=false&limit=1")
      if (res.ok) {
        const data = await res.json()
        setUnreadCount(data.meta?.unreadCount ?? 0)
      }
    } catch {
      // Silently fail on network errors
    }
  }, [])

  useEffect(() => {
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [fetchUnreadCount])

  useEffect(() => {
    let es: EventSource | null = null
    try {
      es = new EventSource("/api/notifications/stream")
      es.onmessage = (event) => {
        const data = JSON.parse(event.data)
        if (data.type === "notification") {
          setUnreadCount((prev) => prev + 1)
        }
      }
      es.onerror = () => {
        es?.close()
      }
    } catch {
      // SSE not supported, polling fallback is already running
    }
    return () => {
      es?.close()
    }
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleMarkAllRead = useCallback(() => {
    setUnreadCount(0)
  }, [])

  return (
    <div ref={ref} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={
          "relative rounded-xl p-2 transition-colors " +
          "text-[var(--color-text-tertiary)] " +
          "hover:bg-[var(--color-surface-100)] hover:text-[var(--color-text-primary)]"
        }
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span
            className={
              "absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center " +
              "justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
            }
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationCenter
          onClose={() => setIsOpen(false)}
          onMarkAllRead={handleMarkAllRead}
        />
      )}
    </div>
  )
}
