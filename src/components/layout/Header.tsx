"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Bell } from "lucide-react"
import { useDebouncedSearch } from "@/hooks/use-debounced-search"
import { useNotificationStore } from "@/store/notifications"
import { MobileNav } from "./MobileNav"

export function Header() {
  const router = useRouter()
  const { query, setQuery, results, clear } = useDebouncedSearch(300)
  const [showResults, setShowResults] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  const notifications = useNotificationStore((s) => s.notifications)
  const unreadCount = useNotificationStore((s) => s.unreadCount)()
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead)
  const markAsRead = useNotificationStore((s) => s.markAsRead)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleChange = useCallback(
    (value: string) => {
      setQuery(value)
      if (value.length >= 1) {
        setShowResults(true)
      } else {
        setShowResults(false)
      }
    },
    [setQuery]
  )

  const handleSelect = useCallback(
    (ticker: string) => {
      clear()
      setShowResults(false)
      router.push(`/stock/${ticker}`)
    },
    [router, clear]
  )

  const handleNotificationClick = useCallback(
    (id: string, ticker: string) => {
      markAsRead(id)
      setShowNotifications(false)
      router.push(`/stock/${ticker}`)
    },
    [router, markAsRead]
  )

  return (
    <header
      className={
        "sticky top-0 z-20 flex h-16 items-center gap-4 px-4 lg:px-6 " +
        "border-b border-[var(--color-border-subtle)] " +
        "bg-white/80 backdrop-blur-xl"
      }
    >
      <MobileNav />

      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => query.length >= 1 && setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          placeholder="종목명 또는 코드 검색..."
          className={
            "w-full rounded-xl py-2 pl-10 pr-4 text-sm outline-none transition-all duration-200 " +
            "bg-[var(--color-surface-100)] text-[var(--color-text-primary)] " +
            "ring-1 ring-[var(--color-border-default)] " +
            "placeholder:text-[var(--color-text-muted)] " +
            "focus:ring-[var(--color-accent-400)] focus:bg-white"
          }
        />

        {showResults && results.length > 0 && (
          <div
            className={
              "absolute left-0 top-full mt-2 w-full rounded-xl overflow-hidden " +
              "border border-[var(--color-border-default)] " +
              "bg-white shadow-lg shadow-black/8"
            }
          >
            {results.map((stock) => (
              <button
                key={stock.ticker}
                type="button"
                onMouseDown={() => handleSelect(stock.ticker)}
                className={
                  "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm " +
                  "transition-colors hover:bg-[var(--color-surface-50)]"
                }
              >
                <span className="font-mono text-[11px] text-[var(--color-text-muted)]">
                  {stock.ticker}
                </span>
                <span className="font-medium text-[var(--color-text-primary)]">
                  {stock.name}
                </span>
                <span className="ml-auto text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                  {stock.market}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Notification bell */}
      <div ref={notifRef} className="relative">
        <button
          type="button"
          onClick={() => setShowNotifications((prev) => !prev)}
          className="relative rounded-xl p-2 text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-surface-100)] hover:text-[var(--color-text-primary)]"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {showNotifications && (
          <div
            className={
              "absolute right-0 top-full mt-2 w-80 rounded-xl overflow-hidden " +
              "border border-[var(--color-border-default)] " +
              "bg-white shadow-lg shadow-black/8 animate-fade-in"
            }
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] px-4 py-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                알림
              </span>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-[10px] font-medium text-[var(--color-accent-500)] transition-colors hover:text-[var(--color-accent-400)]"
                >
                  모두 읽음
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-8 text-center text-xs text-[var(--color-text-tertiary)]">
                  알림이 없습니다
                </p>
              ) : (
                notifications.slice(0, 20).map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => handleNotificationClick(n.id, n.ticker)}
                    className={
                      "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--color-surface-50)] " +
                      (n.read ? "" : "bg-[var(--color-surface-50)]/50")
                    }
                  >
                    <span
                      className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                        n.type === "insider_buy" ? "bg-[var(--color-gain)]" : "bg-[var(--color-loss)]"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-[var(--color-text-primary)]">
                        {n.message}
                      </p>
                      <p className="mt-0.5 text-[10px] text-[var(--color-text-tertiary)]">
                        {n.ticker} · {n.date}
                      </p>
                    </div>
                    {!n.read && (
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent-400)]" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
