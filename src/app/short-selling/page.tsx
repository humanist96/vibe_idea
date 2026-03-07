"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils/cn"

interface ShortSellingRank {
  readonly ticker: string
  readonly name: string
  readonly close: number
  readonly shortVolume: number
  readonly shortRatio: number
}

function formatVolume(v: number): string {
  const abs = Math.abs(v)
  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${(v / 1_000).toFixed(0)}K`
  return v.toLocaleString("ko-KR")
}

export default function ShortSellingPage() {
  const [data, setData] = useState<ShortSellingRank[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/short-selling")
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

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          공매도 현황
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
          시가총액 상위 종목의 공매도 비율 랭킹
        </p>
      </div>

      {loading ? (
        <div className="space-y-4 animate-fade-up stagger-2">
          <LoadingSkeleton className="h-64 w-full rounded-lg" />
        </div>
      ) : data.length === 0 ? (
        <Card className="animate-fade-up stagger-2">
          <div className="py-12 text-center text-[var(--color-text-tertiary)]">
            공매도 데이터를 불러올 수 없습니다.
          </div>
        </Card>
      ) : (
        <Card className="animate-fade-up stagger-2">
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <TrendingDown className="h-3.5 w-3.5 text-[var(--color-accent-500)]" />
                공매도 비율 TOP
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
                    순위
                  </th>
                  <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                    종목
                  </th>
                  <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                    종가
                  </th>
                  <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                    공매도량
                  </th>
                  <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                    공매도 비율
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((s, i) => (
                  <tr
                    key={s.ticker}
                    className="table-row-hover border-b border-[var(--color-border-subtle)] last:border-0"
                  >
                    <td className="py-2.5 text-[var(--color-text-muted)] tabular-nums">
                      {i + 1}
                    </td>
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
                    <td className="py-2.5 text-right tabular-nums text-[var(--color-text-primary)]">
                      {s.close.toLocaleString("ko-KR")}
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-[var(--color-text-secondary)]">
                      {formatVolume(s.shortVolume)}
                    </td>
                    <td className="py-2.5 text-right">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                          s.shortRatio >= 10
                            ? "bg-[var(--color-gain-soft)] text-[var(--color-gain)]"
                            : s.shortRatio >= 5
                              ? "bg-amber-50 text-amber-600"
                              : "bg-[var(--color-surface-100)] text-[var(--color-text-secondary)]"
                        )}
                      >
                        {s.shortRatio.toFixed(2)}%
                      </span>
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
