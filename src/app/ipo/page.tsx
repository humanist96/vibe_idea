"use client"

import { useState, useEffect, useMemo } from "react"
import { Card } from "@/components/ui/Card"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { IpoCard } from "@/components/ipo/IpoCard"
import { cn } from "@/lib/utils/cn"

interface IpoItem {
  readonly company: string
  readonly sector: string
  readonly leadUnderwriter: string
  readonly offeringPriceRange: string
  readonly offeringPrice: string
  readonly demandForecastDate: string
  readonly subscriptionDate: string
  readonly listingDate: string
  readonly competitionRate: string
  readonly status: "upcoming" | "active" | "listed"
  readonly dDay: number | null
}

type TabKey = "upcoming" | "active" | "listed"

const TABS: readonly { readonly key: TabKey; readonly label: string }[] = [
  { key: "upcoming", label: "청약예정" },
  { key: "active", label: "청약중" },
  { key: "listed", label: "최근상장" },
]

export default function IpoPage() {
  const [items, setItems] = useState<IpoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabKey>("upcoming")

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/ipo")
        const json = await res.json()
        if (json.success) {
          setItems(json.data ?? [])
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredItems = useMemo(() => {
    return items.filter((item) => item.status === tab)
  }, [items, tab])

  const counts = useMemo(() => {
    const upcoming = items.filter((i) => i.status === "upcoming").length
    const active = items.filter((i) => i.status === "active").length
    const listed = items.filter((i) => i.status === "listed").length
    return { upcoming, active, listed }
  }, [items])

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          공모주 캘린더
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
          IPO 청약 일정 및 경쟁률 현황
        </p>
      </div>

      {/* Tabs */}
      <div className="animate-fade-up stagger-2 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200",
              tab === t.key
                ? "bg-[var(--color-accent-400)] text-white shadow-sm"
                : "bg-[var(--color-surface-100)] text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-200)]"
            )}
          >
            {t.label}
            <span className="ml-1 text-xs opacity-70">
              {counts[t.key]}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-fade-up stagger-3">
          <LoadingSkeleton className="h-48 w-full rounded-xl" />
          <LoadingSkeleton className="h-48 w-full rounded-xl" />
          <LoadingSkeleton className="h-48 w-full rounded-xl" />
        </div>
      ) : filteredItems.length === 0 ? (
        <Card className="animate-fade-up stagger-3">
          <div className="py-12 text-center text-[var(--color-text-tertiary)]">
            {tab === "upcoming" && "예정된 공모주가 없습니다."}
            {tab === "active" && "현재 청약 중인 공모주가 없습니다."}
            {tab === "listed" && "최근 상장한 공모주가 없습니다."}
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-fade-up stagger-3">
          {filteredItems.map((item) => (
            <IpoCard key={item.company} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
