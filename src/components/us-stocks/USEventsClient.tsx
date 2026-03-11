"use client"

import { useState, useEffect, useMemo } from "react"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { EventTypeFilter } from "./EventTypeFilter"
import { EventList } from "./EventList"
import { EventDetailModal } from "./EventDetailModal"

type USEventType = "EARNINGS" | "IPO" | "OTHER"
type USEventTypeFilter = "ALL" | "EARNINGS" | "IPO"
type PeriodDays = 7 | 30 | 90

interface USEventItem {
  readonly id: string
  readonly ticker: string
  readonly company: string
  readonly type: USEventType
  readonly title: string
  readonly eventDate: string
  readonly metadata: Readonly<Record<string, unknown>>
  readonly source: "finnhub"
}

export function USEventsClient() {
  const [events, setEvents] = useState<USEventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<PeriodDays>(30)
  const [eventType, setEventType] = useState<USEventTypeFilter>("ALL")
  const [selectedEvent, setSelectedEvent] = useState<USEventItem | null>(null)

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          days: String(period),
          type: eventType,
        })
        const res = await fetch(
          `/api/us-stocks/events?${params.toString()}`
        )
        const json = await res.json()
        if (json.success) {
          setEvents(json.data)
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [period, eventType])

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const e of events) {
      counts[e.type] = (counts[e.type] ?? 0) + 1
    }
    return counts
  }, [events])

  return (
    <div className="space-y-6">
      <div className="animate-fade-up flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            미국 기업 이벤트
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
            Finnhub 기반 실적 발표, IPO 등 주요 이벤트
          </p>
        </div>
      </div>

      <div className="animate-fade-up stagger-2">
        <EventTypeFilter
          period={period}
          eventType={eventType}
          onPeriodChange={setPeriod}
          onEventTypeChange={setEventType}
          counts={typeCounts}
        />
      </div>

      {loading ? (
        <div className="space-y-3 animate-fade-up stagger-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <EventList
          events={events}
          onSelectEvent={setSelectedEvent}
        />
      )}

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  )
}
