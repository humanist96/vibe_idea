"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils/cn"
import { Calendar, TrendingUp, TrendingDown } from "lucide-react"

interface EarningsEvent {
  readonly symbol: string
  readonly name: string
  readonly nameKr: string | null
  readonly date: string
  readonly hour: string
  readonly epsEstimate: number | null
  readonly epsActual: number | null
  readonly revenueEstimate: number | null
  readonly revenueActual: number | null
}

const HOUR_LABEL: Record<string, string> = {
  bmo: "장전",
  amc: "장후",
  dmh: "장중",
}

export function USEarningsCalendar() {
  const [events, setEvents] = useState<EarningsEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch_() {
      try {
        const res = await fetch("/api/us-stocks/earnings-calendar")
        const json = await res.json()
        if (json.success) setEvents(json.data)
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetch_()
  }, [])

  if (loading) {
    return (
      <div className="glass-card p-5">
        <div className="h-6 w-32 animate-pulse rounded bg-slate-100" />
        <div className="mt-3 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-slate-50" />
          ))}
        </div>
      </div>
    )
  }

  // 날짜별 그룹
  const grouped = new Map<string, EarningsEvent[]>()
  for (const event of events.slice(0, 30)) {
    const existing = grouped.get(event.date) ?? []
    grouped.set(event.date, [...existing, event])
  }

  const dates = Array.from(grouped.keys()).sort().slice(0, 5)

  return (
    <div className="glass-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <Calendar className="h-4 w-4 text-amber-500" />
        <h2 className="text-sm font-semibold text-[var(--color-text-secondary)]">실적 캘린더</h2>
      </div>
      {dates.length === 0 ? (
        <p className="py-4 text-center text-xs text-[var(--color-text-muted)]">
          예정된 실적 발표가 없습니다.
        </p>
      ) : (
        <div className="space-y-3">
          {dates.map((date) => (
            <div key={date}>
              <p className="mb-1 text-[10px] font-semibold uppercase text-[var(--color-text-muted)]">
                {new Date(date + "T00:00:00").toLocaleDateString("ko-KR", {
                  month: "short",
                  day: "numeric",
                  weekday: "short",
                })}
              </p>
              <div className="space-y-0.5">
                {(grouped.get(date) ?? []).slice(0, 5).map((event) => {
                  const hasSurprise = event.epsActual != null && event.epsEstimate != null
                  const beat = hasSurprise && (event.epsActual ?? 0) > (event.epsEstimate ?? 0)
                  return (
                    <Link
                      key={event.symbol}
                      href={`/us-stocks/${event.symbol}`}
                      className="flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors hover:bg-[var(--color-surface-50)]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-[var(--color-text-primary)]">
                          {event.symbol}
                        </span>
                        <span className="text-[10px] text-[var(--color-text-muted)]">
                          {HOUR_LABEL[event.hour] ?? event.hour}
                        </span>
                      </div>
                      {hasSurprise ? (
                        <span className={cn(
                          "inline-flex items-center gap-0.5 text-[10px] font-semibold",
                          beat ? "text-emerald-600" : "text-red-600"
                        )}>
                          {beat ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {beat ? "Beat" : "Miss"}
                        </span>
                      ) : (
                        <span className="text-[10px] text-[var(--color-text-muted)]">
                          {event.epsEstimate != null ? `Est. $${event.epsEstimate.toFixed(2)}` : ""}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
