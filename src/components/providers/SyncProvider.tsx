"use client"

import { useEffect, useRef, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useWatchlistStore } from "@/store/watchlist"
import { useScreenerPresetsStore } from "@/store/screener-presets"
import { useScreenerDefaultsStore } from "@/store/screener-defaults"
import { useRecentlyViewedStore } from "@/store/recently-viewed"
import { useNotificationStore } from "@/store/notifications"

interface UserData {
  watchlist: string[]
  presets: Array<{
    id: string
    name: string
    filters: Record<string, string>
    createdAt: number
  }>
  defaults: {
    lastFilters: Record<string, string>
    lastSort: string
    lastOrder: string
  } | null
  recentlyViewed: Array<{
    ticker: string
    name: string
    viewedAt: number
  }>
  notifications: Array<{
    id: string
    type: string
    ticker: string
    stockName: string
    message: string
    date: string
    read: boolean
  }>
}

function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout> | null = null
  const debounced = (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
  debounced.cancel = () => {
    if (timer) clearTimeout(timer)
  }
  return debounced
}

interface SyncProviderProps {
  readonly children: React.ReactNode
}

export function SyncProvider({ children }: SyncProviderProps) {
  const { data: session, status } = useSession()
  const isSyncingRef = useRef(false)
  const hasHydratedRef = useRef(false)
  const prevSessionIdRef = useRef<string | null>(null)

  const syncToServer = useCallback(
    async (endpoint: string, body: unknown) => {
      if (isSyncingRef.current) return
      try {
        await fetch(`/api/user/${endpoint}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      } catch {
        // silently fail — next change will retry
      }
    },
    []
  )

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) {
      hasHydratedRef.current = false
      prevSessionIdRef.current = null
      return
    }

    const userId = session.user.id
    if (prevSessionIdRef.current === userId) return
    prevSessionIdRef.current = userId

    async function hydrateFromServer() {
      isSyncingRef.current = true
      try {
        const res = await fetch("/api/user/data")
        if (!res.ok) return

        const json = await res.json()
        if (!json.success) return

        const data: UserData = json.data

        const hasDbData =
          data.watchlist.length > 0 ||
          data.presets.length > 0 ||
          data.defaults !== null ||
          data.recentlyViewed.length > 0 ||
          data.notifications.length > 0

        if (!hasDbData) {
          // First login migration: push localStorage data to DB
          const watchlist = useWatchlistStore.getState().tickers
          const presets = useScreenerPresetsStore.getState().presets
          const defaults = useScreenerDefaultsStore.getState()
          const recentlyViewed = useRecentlyViewedStore.getState().stocks
          const notifications = useNotificationStore.getState().notifications

          const hasLocalData =
            watchlist.length > 0 ||
            presets.length > 0 ||
            Object.keys(defaults.lastFilters).length > 0 ||
            recentlyViewed.length > 0 ||
            notifications.length > 0

          if (hasLocalData) {
            await Promise.all([
              watchlist.length > 0
                ? fetch("/api/user/watchlist", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ tickers: watchlist }),
                  })
                : null,
              presets.length > 0
                ? fetch("/api/user/presets", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      presets: presets.map((p) => ({
                        id: p.id,
                        name: p.name,
                        filters: p.filters,
                        createdAt: p.createdAt,
                      })),
                    }),
                  })
                : null,
              Object.keys(defaults.lastFilters).length > 0
                ? fetch("/api/user/defaults", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      lastFilters: defaults.lastFilters,
                      lastSort: defaults.lastSort,
                      lastOrder: defaults.lastOrder,
                    }),
                  })
                : null,
              recentlyViewed.length > 0
                ? fetch("/api/user/recently-viewed", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      stocks: recentlyViewed.map((s) => ({
                        ticker: s.ticker,
                        name: s.name,
                        viewedAt: s.viewedAt,
                      })),
                    }),
                  })
                : null,
              notifications.length > 0
                ? fetch("/api/user/notifications", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ notifications }),
                  })
                : null,
            ])
          }
        } else {
          // DB has data — overwrite local stores (DB wins)
          useWatchlistStore.setState({ tickers: data.watchlist })

          useScreenerPresetsStore.setState({
            presets: data.presets.map((p) => ({
              id: p.id,
              name: p.name,
              filters: p.filters,
              createdAt: p.createdAt,
            })),
          })

          if (data.defaults) {
            useScreenerDefaultsStore.setState({
              lastFilters: data.defaults.lastFilters,
              lastSort: data.defaults.lastSort,
              lastOrder: data.defaults.lastOrder as "asc" | "desc",
            })
          }

          useRecentlyViewedStore.setState({
            stocks: data.recentlyViewed.map((r) => ({
              ticker: r.ticker,
              name: r.name,
              viewedAt: r.viewedAt,
            })),
          })

          useNotificationStore.setState({
            notifications: data.notifications.map((n) => ({
              id: n.id,
              type: n.type as "insider_buy" | "insider_sell",
              ticker: n.ticker,
              stockName: n.stockName,
              message: n.message,
              date: n.date,
              read: n.read,
            })),
          })
        }

        hasHydratedRef.current = true
      } catch {
        // hydration failed — keep local data
      } finally {
        isSyncingRef.current = false
      }
    }

    hydrateFromServer()
  }, [status, session?.user?.id])

  // Subscribe to store changes and sync to DB
  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return

    const debouncedWatchlist = debounce(() => {
      const { tickers } = useWatchlistStore.getState()
      syncToServer("watchlist", { tickers })
    }, 1000)

    const debouncedPresets = debounce(() => {
      const { presets } = useScreenerPresetsStore.getState()
      syncToServer("presets", {
        presets: presets.map((p) => ({
          id: p.id,
          name: p.name,
          filters: p.filters,
          createdAt: p.createdAt,
        })),
      })
    }, 1000)

    const debouncedDefaults = debounce(() => {
      const { lastFilters, lastSort, lastOrder } =
        useScreenerDefaultsStore.getState()
      syncToServer("defaults", { lastFilters, lastSort, lastOrder })
    }, 1000)

    const debouncedRecentlyViewed = debounce(() => {
      const { stocks } = useRecentlyViewedStore.getState()
      syncToServer("recently-viewed", {
        stocks: stocks.map((s) => ({
          ticker: s.ticker,
          name: s.name,
          viewedAt: s.viewedAt,
        })),
      })
    }, 1000)

    const debouncedNotifications = debounce(() => {
      const { notifications } = useNotificationStore.getState()
      syncToServer("notifications", { notifications })
    }, 1000)

    const unsubs = [
      useWatchlistStore.subscribe(debouncedWatchlist),
      useScreenerPresetsStore.subscribe(debouncedPresets),
      useScreenerDefaultsStore.subscribe(debouncedDefaults),
      useRecentlyViewedStore.subscribe(debouncedRecentlyViewed),
      useNotificationStore.subscribe(debouncedNotifications),
    ]

    return () => {
      unsubs.forEach((unsub) => unsub())
      debouncedWatchlist.cancel()
      debouncedPresets.cancel()
      debouncedDefaults.cancel()
      debouncedRecentlyViewed.cancel()
      debouncedNotifications.cancel()
    }
  }, [status, session?.user?.id, syncToServer])

  return <>{children}</>
}
