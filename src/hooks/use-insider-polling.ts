"use client"

import { useEffect, useCallback } from "react"
import { useWatchlistStore } from "@/store/watchlist"
import { useNotificationStore } from "@/store/notifications"
import { useToastStore } from "@/store/toast"
import type { NotificationType } from "@/store/notifications"
import type { ToastType } from "@/store/toast"

const FIFTEEN_MINUTES = 15 * 60 * 1000
const TEN_MINUTES = 10 * 60 * 1000

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

interface AdvancedTriggeredAlert {
  readonly ruleId: string
  readonly ticker: string
  readonly type: string
  readonly message: string
  readonly severity: "info" | "warning" | "critical"
  readonly metadata: Record<string, unknown>
}

interface AlertRule {
  readonly id: string
  readonly ticker: string
  readonly market: string
  readonly type: string
  readonly threshold: number | null
  readonly thresholdUnit: string | null
  readonly notes: string | null
  readonly active: boolean
  readonly lastTriggeredAt: string | null
}

const ADVANCED_TYPES = new Set([
  "BREAKOUT_RESISTANCE",
  "BREAKDOWN_SUPPORT",
  "EARNINGS_SURPRISE",
  "FOREIGN_BULK_BUY",
  "INSTITUTION_BULK_BUY",
])

const ALERT_TYPE_TO_NOTIFICATION: Record<string, NotificationType> = {
  BREAKOUT_RESISTANCE: "breakout_resistance",
  BREAKDOWN_SUPPORT: "breakdown_support",
  EARNINGS_SURPRISE: "earnings_surprise",
  FOREIGN_BULK_BUY: "foreign_bulk_buy",
  INSTITUTION_BULK_BUY: "institution_bulk_buy",
}

/**
 * Build a dedup key that prevents the same alert from repeating.
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

      const existingKeys = new Set(
        existing.map((n) => {
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
          severity: "warning",
          alertRuleId: null,
          metadata: { price: alert.price, changePercent: alert.changePercent },
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
          severity: "info",
          alertRuleId: null,
          metadata: { value: alert.value },
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
          severity: "info",
          alertRuleId: null,
          metadata: { dDay: alert.dDay, quarter: alert.quarter },
        })
        addToast({ type: "earnings_alert", ticker: alert.ticker, message: msg })
        existingKeys.add(key)
      }
    } catch {
      // silently fail
    }
  }, [tickers, addNotification, addToast])

  const checkAdvancedAlerts = useCallback(async () => {
    try {
      // Fetch user alert rules
      const rulesRes = await fetch("/api/user/alert-rules")
      if (!rulesRes.ok) return

      const rulesJson = await rulesRes.json()
      const allRules: AlertRule[] = rulesJson.data ?? []

      // Filter to advanced types only
      const advancedRules = allRules.filter(
        (r) => r.active && ADVANCED_TYPES.has(r.type)
      )

      if (advancedRules.length === 0) return

      const rulesToCheck = advancedRules.map((r) => ({
        ruleId: r.id,
        ticker: r.ticker,
        market: r.market as "KR" | "US",
        type: r.type,
        threshold: r.threshold,
        thresholdUnit: r.thresholdUnit,
        notes: r.notes,
        lastTriggeredAt: r.lastTriggeredAt,
      }))

      const res = await fetch("/api/alerts/check-advanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules: rulesToCheck }),
      })

      if (!res.ok) return

      const json = await res.json()
      if (!json.success) return

      const triggeredAlerts: AdvancedTriggeredAlert[] = json.data?.triggered ?? []
      const existing = useNotificationStore.getState().notifications

      const existingKeys = new Set(
        existing.map((n) => buildDedupKey(n.type, n.ticker))
      )

      const today = new Date().toISOString().slice(0, 10)

      for (const alert of triggeredAlerts) {
        const notifType = ALERT_TYPE_TO_NOTIFICATION[alert.type]
        if (!notifType) continue

        const key = buildDedupKey(notifType, alert.ticker)
        if (existingKeys.has(key)) continue

        addNotification({
          type: notifType,
          ticker: alert.ticker,
          stockName: alert.ticker,
          message: alert.message,
          date: today,
          severity: alert.severity,
          alertRuleId: alert.ruleId,
          metadata: alert.metadata,
        })
        addToast({
          type: notifType as ToastType,
          ticker: alert.ticker,
          message: alert.message,
        })
        existingKeys.add(key)
      }
    } catch {
      // silently fail
    }
  }, [addNotification, addToast])

  useEffect(() => {
    checkAlerts()
    checkAdvancedAlerts()

    const interval = setInterval(() => {
      checkAlerts()
      checkAdvancedAlerts()
    }, intervalMs)

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        checkAlerts()
        checkAdvancedAlerts()
      }
    }
    document.addEventListener("visibilitychange", handleVisibility)

    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [checkAlerts, checkAdvancedAlerts, intervalMs])
}

/** @deprecated Use useAlertPolling instead */
export const useInsiderPolling = useAlertPolling
