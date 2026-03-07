"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { Calendar, Rocket } from "lucide-react"

interface IPOEvent {
  readonly date: string
  readonly exchange: string
  readonly name: string
  readonly numberOfShares: number
  readonly price: string
  readonly status: string
  readonly symbol: string
  readonly totalSharesValue: number
}

type Tab = "upcoming" | "recent"

export default function USIPOPage() {
  const [tab, setTab] = useState<Tab>("upcoming")
  const [upcoming, setUpcoming] = useState<IPOEvent[]>([])
  const [recent, setRecent] = useState<IPOEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/us-stocks/ipo")
        const json = await res.json()
        if (json.success) {
          setUpcoming(json.data.upcoming ?? [])
          setRecent(json.data.recent ?? [])
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const currentList = tab === "upcoming" ? upcoming : recent

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          US IPO
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
          미국 시장 IPO 예정 및 최근 상장 종목
        </p>
      </div>

      {!loading && (
        <div className="grid gap-4 sm:grid-cols-2 animate-fade-up stagger-1">
          <div className="glass-card rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase text-[var(--color-text-muted)]">
              IPO 예정
            </p>
            <p className="mt-1 text-2xl font-bold text-[var(--color-accent-400)]">
              {upcoming.length}
            </p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase text-[var(--color-text-muted)]">
              최근 상장
            </p>
            <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">
              {recent.length}
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-1 animate-fade-up stagger-2">
        <Button
          variant={tab === "upcoming" ? "primary" : "ghost"}
          size="sm"
          onClick={() => setTab("upcoming")}
        >
          <Rocket className="mr-1 h-3.5 w-3.5" />
          IPO 예정
        </Button>
        <Button
          variant={tab === "recent" ? "primary" : "ghost"}
          size="sm"
          onClick={() => setTab("recent")}
        >
          <Calendar className="mr-1 h-3.5 w-3.5" />
          최근 상장
        </Button>
      </div>

      {loading ? (
        <LoadingSkeleton className="h-64 w-full rounded-lg animate-fade-up stagger-3" />
      ) : currentList.length === 0 ? (
        <Card className="animate-fade-up stagger-3">
          <div className="py-12 text-center text-sm text-[var(--color-text-muted)]">
            {tab === "upcoming" ? "예정된 IPO가 없습니다." : "최근 상장 데이터가 없습니다."}
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-fade-up stagger-3">
          {currentList.slice(0, 30).map((ipo, i) => (
            <Card key={`${ipo.symbol}-${ipo.date}-${i}`} className="glass-card-hover">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-[var(--color-text-primary)]">
                    {ipo.name}
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-[var(--color-text-muted)]">
                    {ipo.symbol || "TBD"}
                  </p>
                </div>
                <span className="rounded-md bg-[var(--color-surface-50)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-text-secondary)]">
                  {ipo.exchange || "US"}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-[var(--color-text-muted)]">상장일</p>
                  <p className="font-medium text-[var(--color-text-primary)]">{ipo.date}</p>
                </div>
                <div>
                  <p className="text-[var(--color-text-muted)]">공모가</p>
                  <p className="font-medium text-[var(--color-text-primary)]">
                    {ipo.price || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-[var(--color-text-muted)]">공모주식수</p>
                  <p className="font-medium tabular-nums text-[var(--color-text-primary)]">
                    {ipo.numberOfShares > 0 ? ipo.numberOfShares.toLocaleString() : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-[var(--color-text-muted)]">공모금액</p>
                  <p className="font-medium tabular-nums text-[var(--color-text-primary)]">
                    {ipo.totalSharesValue > 0
                      ? `$${(ipo.totalSharesValue / 1_000_000).toFixed(1)}M`
                      : "-"}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
