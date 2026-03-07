"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { EarningsSurpriseBadge } from "@/components/stock/EarningsSurpriseBadge"
import { BarChart3, Calendar } from "lucide-react"

interface ReportedEarning {
  readonly symbol: string
  readonly name: string
  readonly nameKr: string
  readonly date: string
  readonly quarter: string
  readonly epsActual: number | null
  readonly epsEstimate: number | null
  readonly surprisePercent: number
  readonly verdict: "beat" | "inline" | "miss"
  readonly hour: string
}

interface UpcomingEarning {
  readonly symbol: string
  readonly name: string
  readonly nameKr: string
  readonly date: string
  readonly quarter: string
  readonly epsEstimate: number | null
  readonly hour: string
}

type Tab = "reported" | "upcoming"

export default function USEarningsPage() {
  const [tab, setTab] = useState<Tab>("reported")
  const [reported, setReported] = useState<ReportedEarning[]>([])
  const [upcoming, setUpcoming] = useState<UpcomingEarning[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/us-stocks/earnings-surprise")
        const json = await res.json()
        if (json.success) {
          setReported(json.data.reported ?? [])
          setUpcoming(json.data.upcoming ?? [])
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const beats = reported.filter((d) => d.verdict === "beat")
  const misses = reported.filter((d) => d.verdict === "miss")

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          US 실적 서프라이즈
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
          S&P 500 종목 컨센서스 대비 실적 분석
        </p>
      </div>

      {!loading && reported.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3 animate-fade-up stagger-2">
          <div className="glass-card rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase text-[var(--color-text-muted)]">
              실적 상회 (Beat)
            </p>
            <p className="mt-1 text-2xl font-bold text-[var(--color-gain)]">
              {beats.length}
            </p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase text-[var(--color-text-muted)]">
              실적 하회 (Miss)
            </p>
            <p className="mt-1 text-2xl font-bold text-[var(--color-loss)]">
              {misses.length}
            </p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase text-[var(--color-text-muted)]">
              발표 예정
            </p>
            <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">
              {upcoming.length}
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-1 animate-fade-up stagger-2">
        <Button
          variant={tab === "reported" ? "primary" : "ghost"}
          size="sm"
          onClick={() => setTab("reported")}
        >
          <BarChart3 className="mr-1 h-3.5 w-3.5" />
          발표 완료
        </Button>
        <Button
          variant={tab === "upcoming" ? "primary" : "ghost"}
          size="sm"
          onClick={() => setTab("upcoming")}
        >
          <Calendar className="mr-1 h-3.5 w-3.5" />
          발표 예정
        </Button>
      </div>

      {loading ? (
        <LoadingSkeleton className="h-64 w-full rounded-lg animate-fade-up stagger-3" />
      ) : tab === "reported" ? (
        <Card className="animate-fade-up stagger-3">
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <BarChart3 className="h-3.5 w-3.5 text-[var(--color-accent-500)]" />
                실적 발표 완료 ({reported.length}건)
              </span>
            </CardTitle>
          </CardHeader>
          {reported.length === 0 ? (
            <div className="py-12 text-center text-sm text-[var(--color-text-muted)]">
              최근 실적 발표 데이터가 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border-subtle)]">
                    <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">종목</th>
                    <th className="pb-2 text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">분기</th>
                    <th className="pb-2 text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">발표일</th>
                    <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">EPS 실적</th>
                    <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">EPS 예상</th>
                    <th className="pb-2 text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">서프라이즈</th>
                  </tr>
                </thead>
                <tbody>
                  {reported.slice(0, 50).map((e) => (
                    <tr key={`${e.symbol}-${e.date}`} className="table-row-hover border-b border-[var(--color-border-subtle)] last:border-0">
                      <td className="py-2.5">
                        <Link
                          href={`/us-stocks/${e.symbol}`}
                          className="font-medium text-[var(--color-text-primary)] transition-colors hover:text-[var(--color-accent-500)]"
                        >
                          {e.nameKr}
                        </Link>
                        <span className="ml-1.5 font-mono text-xs text-[var(--color-text-muted)]">{e.symbol}</span>
                      </td>
                      <td className="py-2.5 text-center text-xs text-[var(--color-text-secondary)]">{e.quarter}</td>
                      <td className="py-2.5 text-center text-xs text-[var(--color-text-secondary)]">{e.date}</td>
                      <td className="py-2.5 text-right tabular-nums text-[var(--color-text-primary)]">
                        {e.epsActual !== null ? `$${e.epsActual.toFixed(2)}` : "-"}
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-[var(--color-text-secondary)]">
                        {e.epsEstimate !== null ? `$${e.epsEstimate.toFixed(2)}` : "-"}
                      </td>
                      <td className="py-2.5 text-center">
                        <EarningsSurpriseBadge
                          verdict={e.verdict}
                          surprisePercent={e.surprisePercent}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : (
        <Card className="animate-fade-up stagger-3">
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-[var(--color-accent-500)]" />
                발표 예정 ({upcoming.length}건)
              </span>
            </CardTitle>
          </CardHeader>
          {upcoming.length === 0 ? (
            <div className="py-12 text-center text-sm text-[var(--color-text-muted)]">
              예정된 실적 발표가 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border-subtle)]">
                    <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">종목</th>
                    <th className="pb-2 text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">분기</th>
                    <th className="pb-2 text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">발표 예정일</th>
                    <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">EPS 예상</th>
                    <th className="pb-2 text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">시간</th>
                  </tr>
                </thead>
                <tbody>
                  {upcoming.slice(0, 50).map((e) => (
                    <tr key={`${e.symbol}-${e.date}`} className="table-row-hover border-b border-[var(--color-border-subtle)] last:border-0">
                      <td className="py-2.5">
                        <Link
                          href={`/us-stocks/${e.symbol}`}
                          className="font-medium text-[var(--color-text-primary)] transition-colors hover:text-[var(--color-accent-500)]"
                        >
                          {e.nameKr}
                        </Link>
                        <span className="ml-1.5 font-mono text-xs text-[var(--color-text-muted)]">{e.symbol}</span>
                      </td>
                      <td className="py-2.5 text-center text-xs text-[var(--color-text-secondary)]">{e.quarter}</td>
                      <td className="py-2.5 text-center text-xs text-[var(--color-text-secondary)]">{e.date}</td>
                      <td className="py-2.5 text-right tabular-nums text-[var(--color-text-secondary)]">
                        {e.epsEstimate !== null ? `$${e.epsEstimate.toFixed(2)}` : "-"}
                      </td>
                      <td className="py-2.5 text-center text-xs text-[var(--color-text-muted)]">
                        {e.hour === "bmo" ? "장전" : e.hour === "amc" ? "장후" : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
