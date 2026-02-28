"use client"

import { useEffect, useRef, useCallback } from "react"
import { useWatchlistStore } from "@/store/watchlist"
import { useNotificationStore } from "@/store/notifications"
import type { InsiderActivity } from "@/lib/api/dart-insider-types"

const THIRTY_MINUTES = 30 * 60 * 1000

export function useInsiderPolling(intervalMs = THIRTY_MINUTES) {
  const tickers = useWatchlistStore((s) => s.tickers)
  const lastCheckedAt = useNotificationStore((s) => s.lastCheckedAt)
  const addNotification = useNotificationStore((s) => s.addNotification)
  const lastCheckedRef = useRef(lastCheckedAt)

  useEffect(() => {
    lastCheckedRef.current = lastCheckedAt
  }, [lastCheckedAt])

  const checkInsider = useCallback(async () => {
    if (tickers.length === 0) return

    try {
      const res = await fetch("/api/insider/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tickers }),
      })
      const json = await res.json()
      if (!json.success) return

      const cutoff = lastCheckedRef.current.slice(0, 10)

      for (const [ticker, activities] of Object.entries(json.data)) {
        for (const activity of activities as InsiderActivity[]) {
          if (activity.date < cutoff) continue
          if (activity.type === "other") continue

          addNotification({
            type: activity.type === "buy" ? "insider_buy" : "insider_sell",
            ticker,
            stockName: activity.name,
            message: `${activity.name} ${activity.position} ${Math.abs(activity.shares).toLocaleString("ko-KR")}주 ${activity.type === "buy" ? "매수" : "매도"}`,
            date: activity.date,
          })
        }
      }
    } catch {
      // silently fail
    }
  }, [tickers, addNotification])

  useEffect(() => {
    checkInsider()

    const interval = setInterval(checkInsider, intervalMs)

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        checkInsider()
      }
    }
    document.addEventListener("visibilitychange", handleVisibility)

    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [checkInsider, intervalMs])
}
