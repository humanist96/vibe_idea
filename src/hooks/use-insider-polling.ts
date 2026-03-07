"use client"

import { useEffect, useCallback } from "react"
import { useWatchlistStore } from "@/store/watchlist"
import { useNotificationStore } from "@/store/notifications"
import { useToastStore } from "@/store/toast"
import type { NotificationType } from "@/store/notifications"
import type { ToastType } from "@/store/toast"

const FIFTEEN_MINUTES = 15 * 60 * 1000

interface PriceAlert {
  readonly ticker: string
  readonly name: string
  readonly price: number
  readonly changePercent: number
}

interface MarketAlert {
  readonly type: "fear_greed" | "index"
  readonly message: string
  readonly value: number
}

interface EarningsAlert {
  readonly ticker: string
  readonly name: string
  readonly quarter: string
  readonly dDay: number
}

interface AlertsData {
  readonly priceAlerts: PriceAlert[]
  readonly marketAlerts: MarketAlert[]
  readonly earningsAlerts: EarningsAlert[]
}

/**
 * Build a dedup key that prevents the same alert from repeating.
 * - Price alerts: same ticker + direction (surge/drop) won't repeat
 *   until the notification is cleared
 * - Market alerts: same sub-type (fear_greed/index) won't repeat
 * - Earnings alerts: same ticker + quarter won't repeat
 */
function buildDedupKey(type: string, identifier: string, extra?: string): string {
  return extra ? `${identifier}:${type}:${extra}` : `${identifier}:${type}`
}

export function useAlertPolling(intervalMs = FIFTEEN_MINUTES) {
  const tickers = useWatchlistStore((s) => s.tickers)
  const addNotification = useNotificationStore((s) => s.addNotification)
  const addToast = useToastStore((s) => s.addToast)

  const checkAlerts = useCallback(async () => {
    if (tickers.length === 0) return

    try {
      const res = await fetch("/api/alerts/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tickers }),
      })
      const json = await res.json()
      if (!json.success) return

      const data: AlertsData = json.data
      const existing = useNotificationStore.getState().notifications

      // Build dedup keys from ALL existing notifications (not just today)
      const existingKeys = new Set(
        existing.map((n) => {
          // For earnings, extract quarter from message to make key more specific
          const quarterMatch = n.message.match(/\(([^)]+)\)\s*$/)
          const quarter = quarterMatch ? quarterMatch[1] : undefined
          return buildDedupKey(n.type, n.ticker, quarter)
        })
      )

      const today = new Date().toISOString().slice(0, 10)

      // --- Price alerts ---
      for (const alert of data.priceAlerts) {
        const type: NotificationType = alert.changePercent > 0 ? "price_surge" : "price_drop"
        const key = buildDedupKey(type, alert.ticker)
        if (existingKeys.has(key)) continue

        const direction = alert.changePercent > 0 ? "급등" : "급락"
        const sign = alert.changePercent > 0 ? "+" : ""
        const msg = `${alert.name} ${direction} ${sign}${alert.changePercent.toFixed(1)}% (${alert.price.toLocaleString("ko-KR")}원)`

        addNotification({
          type,
          ticker: alert.ticker,
          stockName: alert.name,
          message: msg,
          date: today,
        })
        addToast({ type: type as ToastType, ticker: alert.ticker, message: msg })
        existingKeys.add(key)
      }

      // --- Market alerts ---
      for (const alert of data.marketAlerts) {
        const type: NotificationType = "market_alert"
        const key = buildDedupKey(type, alert.type)
        if (existingKeys.has(key)) continue

        addNotification({
          type,
          ticker: "",
          stockName: "",
          message: alert.message,
          date: today,
        })
        addToast({ type: "market_alert", message: alert.message })
        existingKeys.add(key)
      }

      // --- Earnings alerts ---
      for (const alert of data.earningsAlerts) {
        const type: NotificationType = "earnings_alert"
        const key = buildDedupKey(type, alert.ticker, alert.quarter)
        if (existingKeys.has(key)) continue

        const dDayLabel = alert.dDay === 0 ? "오늘" : `D-${alert.dDay}`
        const msg = `${alert.name} 실적 발표 ${dDayLabel} (${alert.quarter})`

        addNotification({
          type,
          ticker: alert.ticker,
          stockName: alert.name,
          message: msg,
          date: today,
        })
        addToast({ type: "earnings_alert", ticker: alert.ticker, message: msg })
        existingKeys.add(key)
      }
    } catch {
      // silently fail
    }
  }, [tickers, addNotification, addToast])

  useEffect(() => {
    checkAlerts()

    const interval = setInterval(checkAlerts, intervalMs)

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        checkAlerts()
      }
    }
    document.addEventListener("visibilitychange", handleVisibility)

    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [checkAlerts, intervalMs])
}

/** @deprecated Use useAlertPolling instead */
export const useInsiderPolling = useAlertPolling
