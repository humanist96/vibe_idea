"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { EarningsSurpriseBadge } from "@/components/stock/EarningsSurpriseBadge"
import { BarChart3 } from "lucide-react"

interface EarningsRank {
  readonly ticker: string
  readonly name: string
  readonly quarter: string
  readonly surprisePercent: number
  readonly verdict: "beat" | "inline" | "miss"
  readonly metric: string
  readonly actual: number
  readonly consensus: number
}

function formatAmount(v: number): string {
  const abs = Math.abs(v)
  if (abs >= 10000) return `${(v / 10000).toFixed(0)}조`
  return `${v.toLocaleString("ko-KR")}억`
}

export default function EarningsPage() {
  const [data, setData] = useState<EarningsRank[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/earnings")
        const json = await res.json()
        if (json.success) {
          setData(json.data ?? [])
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const beats = data.filter((d) => d.verdict === "beat")
  const misses = data.filter((d) => d.verdict === "miss")

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          실적 서프라이즈
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
          컨센서스 대비 실적 상회/하회 종목 분석
        </p>
      </div>

      {/* Summary Cards */}
      {!loading && data.length > 0 && (
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
              분석 종목
            </p>
            <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">
              {data.length}
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-4 animate-fade-up stagger-3">
          <LoadingSkeleton className="h-64 w-full rounded-lg" />
        </div>
      ) : data.length === 0 ? (
        <Card className="animate-fade-up stagger-3">
          <div className="py-12 text-center text-[var(--color-text-tertiary)]">
            실적 데이터를 분석할 수 없습니다.
          </div>
        </Card>
      ) : (
        <Card className="animate-fade-up stagger-3">
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <BarChart3 className="h-3.5 w-3.5 text-[var(--color-accent-500)]" />
                실적 서프라이즈 현황
                <span className="text-xs font-normal text-[var(--color-text-tertiary)]">
                  ({data.length}종목)
                </span>
              </span>
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border-subtle)]">
                  <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                    종목
                  </th>
                  <th className="pb-2 text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                    분기
                  </th>
                  <th className="pb-2 text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                    지표
                  </th>
                  <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                    실적
                  </th>
                  <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                    컨센서스
                  </th>
                  <th className="pb-2 text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                    서프라이즈
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((s) => (
                  <tr
                    key={s.ticker}
                    className="table-row-hover border-b border-[var(--color-border-subtle)] last:border-0"
                  >
                    <td className="py-2.5">
                      <Link
                        href={`/stock/${s.ticker}`}
                        className="font-medium text-[var(--color-text-primary)] transition-colors hover:text-[var(--color-accent-500)]"
                      >
                        {s.name}
                      </Link>
                      <span className="ml-1.5 font-mono text-xs text-[var(--color-text-muted)]">
                        {s.ticker}
                      </span>
                    </td>
                    <td className="py-2.5 text-center text-xs text-[var(--color-text-secondary)]">
                      {s.quarter}
                    </td>
                    <td className="py-2.5 text-center text-xs text-[var(--color-text-secondary)]">
                      {s.metric}
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-[var(--color-text-primary)]">
                      {formatAmount(s.actual)}
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-[var(--color-text-secondary)]">
                      {formatAmount(s.consensus)}
                    </td>
                    <td className="py-2.5 text-center">
                      <EarningsSurpriseBadge
                        verdict={s.verdict}
                        surprisePercent={s.surprisePercent}
                      />
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
