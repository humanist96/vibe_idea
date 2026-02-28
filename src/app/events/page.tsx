"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { Bell, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import type { EventCategory } from "@/lib/api/dart-events-types"

interface EventRow {
  readonly id: string
  readonly date: string
  readonly corpName: string
  readonly stockCode: string
  readonly reportName: string
  readonly category: EventCategory
  readonly filer: string
  readonly rceptNo: string
}

type PeriodDays = 7 | 30 | 90

const PERIOD_OPTIONS: readonly { readonly label: string; readonly days: PeriodDays }[] = [
  { label: "7일", days: 7 },
  { label: "30일", days: 30 },
  { label: "90일", days: 90 },
]

const CATEGORY_OPTIONS: readonly { readonly label: string; readonly value: EventCategory | "all" }[] = [
  { label: "전체", value: "all" },
  { label: "유상증자", value: "유상증자" },
  { label: "무상증자", value: "무상증자" },
  { label: "자사주", value: "자사주" },
  { label: "사채", value: "사채" },
  { label: "합병·분할", value: "합병분할" },
  { label: "기타", value: "기타" },
]

const CATEGORY_COLORS: Record<EventCategory, "blue" | "green" | "yellow" | "red" | "gray"> = {
  "유상증자": "blue",
  "무상증자": "green",
  "자사주": "yellow",
  "사채": "red",
  "합병분할": "gray",
  "기타": "gray",
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventRow[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<PeriodDays>(30)
  const [category, setCategory] = useState<EventCategory | "all">("all")

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true)
      try {
        const params = new URLSearchParams({ days: String(period) })
        if (category !== "all") params.set("category", category)

        const res = await fetch(`/api/events?${params.toString()}`)
        const json = await res.json()
        if (json.success) setEvents(json.data)
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [period, category])

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const e of events) {
      counts[e.category] = (counts[e.category] ?? 0) + 1
    }
    return counts
  }, [events])

  return (
    <div className="space-y-6">
      <div className="animate-fade-up flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            기업 이벤트
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
            DART 주요사항보고서 기반 기업 이벤트
          </p>
        </div>

        <div className="flex gap-1 rounded-lg bg-[var(--color-surface-50)] p-1">
          {PERIOD_OPTIONS.map((opt) => (
            <Button
              key={opt.days}
              variant={period === opt.days ? "primary" : "ghost"}
              size="sm"
              onClick={() => setPeriod(opt.days)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Category Filters */}
      <div className="animate-fade-up stagger-2 flex flex-wrap gap-2">
        {CATEGORY_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            variant={category === opt.value ? "primary" : "ghost"}
            size="sm"
            onClick={() => setCategory(opt.value)}
          >
            {opt.label}
            {opt.value !== "all" && categoryCounts[opt.value] ? (
              <span className="ml-1 text-[10px] opacity-60">
                {categoryCounts[opt.value]}
              </span>
            ) : null}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3 animate-fade-up stagger-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <Card className="animate-fade-up stagger-3">
          <div className="py-12 text-center">
            <p className="text-sm text-[var(--color-text-tertiary)]">
              최근 {period}일간 해당 기업 이벤트가 없습니다
            </p>
          </div>
        </Card>
      ) : (
        <Card className="animate-fade-up stagger-3">
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <Bell className="h-3.5 w-3.5 text-[var(--color-accent-500)]" />
                이벤트 목록
                <span className="text-xs font-normal text-[var(--color-text-tertiary)]">
                  ({events.length}건)
                </span>
              </span>
            </CardTitle>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border-subtle)]">
                  <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                    날짜
                  </th>
                  <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                    종목
                  </th>
                  <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                    보고서명
                  </th>
                  <th className="pb-2 text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                    분류
                  </th>
                  <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                    링크
                  </th>
                </tr>
              </thead>
              <tbody>
                {events.map((evt) => (
                  <tr
                    key={evt.id}
                    className="table-row-hover border-b border-[var(--color-border-subtle)] last:border-0"
                  >
                    <td className="py-2.5 font-mono text-xs text-[var(--color-text-secondary)]">
                      {evt.date}
                    </td>
                    <td className="py-2.5">
                      {evt.stockCode ? (
                        <Link
                          href={`/stock/${evt.stockCode}`}
                          className="font-mono text-xs text-[var(--color-accent-500)] transition-colors hover:text-[var(--color-accent-400)]"
                        >
                          {evt.stockCode}
                        </Link>
                      ) : null}
                      <span className={cn("text-xs text-[var(--color-text-secondary)]", evt.stockCode && "ml-1.5")}>
                        {evt.corpName}
                      </span>
                    </td>
                    <td className="max-w-xs truncate py-2.5 text-[var(--color-text-primary)]">
                      {evt.reportName}
                    </td>
                    <td className="py-2.5 text-center">
                      <Badge variant={CATEGORY_COLORS[evt.category] ?? "gray"}>
                        {evt.category}
                      </Badge>
                    </td>
                    <td className="py-2.5 text-right">
                      <a
                        href={`https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${evt.rceptNo}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-accent-400)]"
                      >
                        DART
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
