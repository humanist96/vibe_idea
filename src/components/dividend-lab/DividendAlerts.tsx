"use client"

import { useState, useEffect, useCallback } from "react"
import { Bell, AlertTriangle } from "lucide-react"
import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"

interface DividendAlert {
  readonly ticker: string
  readonly name: string
  readonly market: "KR" | "US"
  readonly type: "EX_DATE_D7" | "GAP_MONTH"
  readonly message: string
  readonly date: string | null
}

const ALERT_TYPE_CONFIG: Record<
  DividendAlert["type"],
  { readonly label: string; readonly badgeClass: string }
> = {
  EX_DATE_D7: {
    label: "배당락일 D-7",
    badgeClass: "bg-red-500/20 text-red-300",
  },
  GAP_MONTH: {
    label: "공백월",
    badgeClass: "bg-amber-500/20 text-amber-300",
  },
}

function AlertIcon({ type }: { readonly type: DividendAlert["type"] }) {
  if (type === "GAP_MONTH") {
    return <AlertTriangle className="h-4 w-4 text-amber-400" />
  }
  return <Bell className="h-4 w-4 text-red-400" />
}

export function DividendAlerts() {
  const [alerts, setAlerts] = useState<readonly DividendAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAlerts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/dividend-lab/alerts")
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`)
      }
      const json = await res.json()
      if (json.success) {
        setAlerts(json.data)
      } else {
        setError(json.error ?? "알림 데이터를 불러오지 못했습니다.")
      }
    } catch {
      setError("알림 데이터를 불러오지 못했습니다.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  return (
    <Card className="animate-fade-up stagger-3">
      <CardHeader>
        <CardTitle>
          <Bell className="mr-1.5 inline-block h-3.5 w-3.5" />
          배당 알림
        </CardTitle>
      </CardHeader>

      {error && (
        <div className="mb-3 rounded-md bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
          <button
            type="button"
            onClick={fetchAlerts}
            className="ml-2 underline hover:text-red-300"
          >
            재시도
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Bell className="mb-2 h-8 w-8 text-[var(--color-text-muted)]" />
          <p className="text-sm text-[var(--color-text-muted)]">
            알림 없음
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            포트폴리오에 종목을 추가하면 배당 알림이 표시됩니다
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {alerts.map((alert) => {
            const config = ALERT_TYPE_CONFIG[alert.type]
            return (
              <li
                key={`${alert.ticker}-${alert.type}`}
                className={
                  "flex items-start gap-3 rounded-xl px-4 py-3 " +
                  "border border-[var(--color-border-subtle)] " +
                  "bg-[var(--color-glass-1)] transition-colors hover:bg-[var(--color-glass-2)]"
                }
              >
                <div className="mt-0.5 flex-shrink-0">
                  <AlertIcon type={alert.type} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-[var(--color-text-primary)]">
                      {alert.name}
                    </span>
                    <span
                      className={
                        "rounded px-1.5 py-0.5 text-[10px] font-medium " +
                        (alert.market === "US"
                          ? "bg-blue-50 text-blue-600"
                          : "bg-emerald-50 text-emerald-600")
                      }
                    >
                      {alert.market}
                    </span>
                    <span
                      className={
                        "rounded px-1.5 py-0.5 text-[10px] font-medium " +
                        config.badgeClass
                      }
                    >
                      {config.label}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                    {alert.message}
                  </p>
                </div>

                {alert.date && (
                  <span className="flex-shrink-0 text-[10px] tabular-nums text-[var(--color-text-muted)]">
                    {alert.date}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
