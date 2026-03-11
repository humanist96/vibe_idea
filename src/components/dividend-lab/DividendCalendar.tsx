"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import type { DividendCalendarEvent, DividendMarket } from "@/lib/dividend/dividend-types"
import { useDividendPortfolioStore } from "@/store/dividend-portfolio"
import { MARKET_BADGE_STYLES } from "./constants"
import { DividendAlerts } from "./DividendAlerts"

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"]

const EVENT_COLORS: Record<string, string> = {
  "ex-date": "bg-red-500/20 text-red-300 ring-red-500/30",
  record: "bg-amber-500/20 text-amber-300 ring-amber-500/30",
  payment: "bg-emerald-500/20 text-emerald-300 ring-emerald-500/30",
}

export function DividendCalendar() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [market, setMarket] = useState<DividendMarket | "ALL">("ALL")
  const portfolioItems = useDividendPortfolioStore((s) => s.items)

  const portfolioTickers = useMemo(() => {
    const set = new Set<string>()
    for (const item of portfolioItems) {
      set.add(`${item.market}:${item.ticker}`)
    }
    return set
  }, [portfolioItems])
  const [events, setEvents] = useState<readonly DividendCalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        month: `${year}-${String(month).padStart(2, "0")}`,
        ...(market !== "ALL" ? { market } : {}),
      })
      const res = await fetch(`/api/dividend-lab/calendar?${params}`)
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`)
      }
      const json = await res.json()
      if (json.success) {
        setEvents(json.data)
      }
    } catch {
      setError("캘린더 데이터를 불러오지 못했습니다.")
    } finally {
      setLoading(false)
    }
  }, [year, month, market])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  function goPrev() {
    if (month === 1) {
      setYear(year - 1)
      setMonth(12)
    } else {
      setMonth(month - 1)
    }
  }

  function goNext() {
    if (month === 12) {
      setYear(year + 1)
      setMonth(1)
    } else {
      setMonth(month + 1)
    }
  }

  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()

  const baseDays: readonly (number | null)[] = [
    ...Array.from<null>({ length: firstDay }).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  const paddingCount = (7 - (baseDays.length % 7)) % 7
  const calendarDays: readonly (number | null)[] = [
    ...baseDays,
    ...Array.from<null>({ length: paddingCount }).fill(null),
  ]

  const eventsByDate = useMemo(() => {
    const map = new Map<string, readonly DividendCalendarEvent[]>()
    for (const evt of events) {
      const existing = map.get(evt.date) ?? []
      map.set(evt.date, [...existing, evt])
    }
    return map
  }, [events])

  function getEventsForDay(day: number): readonly DividendCalendarEvent[] {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return eventsByDate.get(dateStr) ?? []
  }

  return (
    <div className="space-y-4">
      <Card className="animate-fade-up stagger-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goPrev}
              aria-label="이전 달"
              className="rounded-md p-1.5 text-[var(--color-text-tertiary)] hover:bg-[var(--color-glass-2)] transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold tabular-nums text-[var(--color-text-primary)]">
              {year}년 {month}월
            </span>
            <button
              type="button"
              onClick={goNext}
              aria-label="다음 달"
              className="rounded-md p-1.5 text-[var(--color-text-tertiary)] hover:bg-[var(--color-glass-2)] transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex gap-1">
            {(["ALL", "KR", "US"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMarket(m)}
                className={
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-all " +
                  (market === m
                    ? "bg-[var(--color-glass-3)] text-[var(--color-text-primary)] ring-1 ring-[var(--color-border-subtle)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]")
                }
              >
                {m === "ALL" ? "전체" : m === "KR" ? "국내" : "해외"}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="p-0 animate-fade-up stagger-2">
        <div className="p-4">
          {/* Legend */}
          <div className="mb-4 flex flex-wrap gap-3 text-[10px]">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-red-400" />
              배당락일
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
              기준일
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
              지급일
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full ring-2 ring-blue-400 bg-transparent" />
              내 포트폴리오
            </span>
          </div>

          {error && (
            <div className="mb-4 rounded-md bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
              <button
                type="button"
                onClick={fetchEvents}
                className="ml-2 underline hover:text-red-300"
              >
                재시도
              </button>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, i) => (
                <LoadingSkeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (
            <>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {DAY_LABELS.map((d, i) => (
                  <div
                    key={d}
                    className={
                      "py-1 text-center text-[10px] font-medium " +
                      (i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-[var(--color-text-muted)]")
                    }
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, idx) => {
                  if (day === null) {
                    return <div key={`empty-${idx}`} className="h-20" />
                  }

                  const dayEvents = getEventsForDay(day)
                  const dayOfWeek = (firstDay + day - 1) % 7

                  return (
                    <div
                      key={day}
                      className={
                        "min-h-[5rem] rounded-md p-1.5 ring-1 ring-[var(--color-border-subtle)] " +
                        (dayEvents.length > 0
                          ? "bg-[var(--color-glass-2)]"
                          : "bg-[var(--color-glass-1)]")
                      }
                    >
                      <span
                        className={
                          "text-[10px] font-medium tabular-nums " +
                          (dayOfWeek === 0
                            ? "text-red-400"
                            : dayOfWeek === 6
                              ? "text-blue-400"
                              : "text-[var(--color-text-tertiary)]")
                        }
                      >
                        {day}
                      </span>
                      <div className="mt-0.5 space-y-0.5">
                        {dayEvents.slice(0, 3).map((evt) => {
                          const isInPortfolio = portfolioTickers.has(`${evt.market}:${evt.ticker}`)
                          return (
                          <div
                            key={`${evt.ticker}-${evt.eventType}`}
                            className={
                              "truncate rounded px-1 py-0.5 text-[8px] font-medium ring-1 " +
                              (EVENT_COLORS[evt.eventType] ?? "") +
                              (isInPortfolio ? " ring-2 ring-blue-400" : "")
                            }
                            title={`${evt.nameKr || evt.name} (${evt.market}) - ${evt.eventType}`}
                          >
                            <span className={`mr-0.5 ${MARKET_BADGE_STYLES[evt.market]}`}>
                              {evt.market}
                            </span>
                            {evt.nameKr || evt.name}
                          </div>
                          )
                        })}
                        {dayEvents.length > 3 && (
                          <div className="text-[8px] text-[var(--color-text-muted)]">
                            +{dayEvents.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </Card>

      <DividendAlerts />
    </div>
  )
}
