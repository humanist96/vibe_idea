"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { Calendar, ArrowRight } from "lucide-react"

interface IpoItem {
  readonly company: string
  readonly subscriptionDate: string
  readonly offeringPrice: string
  readonly offeringPriceRange: string
  readonly status: "upcoming" | "active" | "listed"
  readonly dDay: number | null
}

export function IpoWidget() {
  const [items, setItems] = useState<IpoItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/ipo")
        const json = await res.json()
        if (json.success) {
          const upcoming = (json.data ?? [])
            .filter((i: IpoItem) => i.status === "upcoming" || i.status === "active")
            .slice(0, 3)
          setItems(upcoming)
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return <LoadingSkeleton className="h-40 w-full rounded-xl" />
  }

  if (items.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-[var(--color-accent-500)]" />
            공모주 일정
          </span>
        </CardTitle>
        <Link
          href="/ipo"
          className="flex items-center gap-1 text-xs text-[var(--color-accent-500)] transition-colors hover:text-[var(--color-accent-400)]"
        >
          전체보기 <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.company}
            className="flex items-center justify-between rounded-lg bg-[var(--color-surface-50)] px-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                {item.company}
              </p>
              <p className="text-[10px] text-[var(--color-text-muted)]">
                {item.subscriptionDate || "일정 미정"}
              </p>
            </div>
            {item.status === "active" ? (
              <span className="shrink-0 rounded-full bg-[var(--color-gain-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-gain)]">
                청약중
              </span>
            ) : item.dDay !== null && item.dDay > 0 ? (
              <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
                D-{item.dDay}
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </Card>
  )
}
