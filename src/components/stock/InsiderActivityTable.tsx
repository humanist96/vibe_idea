"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { UserCheck } from "lucide-react"
import type { InsiderActivity } from "@/lib/api/dart-insider-types"

interface InsiderActivityTableProps {
  readonly ticker: string
}

function TypeBadge({ type }: { readonly type: InsiderActivity["type"] }) {
  if (type === "buy") {
    return <Badge variant="green">매수 ↑</Badge>
  }
  if (type === "sell") {
    return <Badge variant="red">매도 ↓</Badge>
  }
  return <Badge variant="gray">기타</Badge>
}

function formatShares(shares: number): string {
  const abs = Math.abs(shares)
  if (abs >= 100_000_000) return `${(abs / 100_000_000).toFixed(1)}억`
  if (abs >= 10_000) return `${(abs / 10_000).toFixed(1)}만`
  return abs.toLocaleString("ko-KR")
}

export function InsiderActivityTable({ ticker }: InsiderActivityTableProps) {
  const [activities, setActivities] = useState<InsiderActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchInsider() {
      try {
        const res = await fetch(`/api/stocks/${ticker}/insider`)
        const json = await res.json()
        if (json.success) {
          setActivities(json.data)
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchInsider()
  }, [ticker])

  if (loading) {
    return (
      <Card className="animate-fade-up stagger-5">
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <UserCheck className="h-3.5 w-3.5 text-[var(--color-accent-500)]" />
              내부자 거래
            </span>
          </CardTitle>
        </CardHeader>
        <div className="space-y-3">
          <LoadingSkeleton className="h-8 w-full" />
          <LoadingSkeleton className="h-8 w-full" />
          <LoadingSkeleton className="h-8 w-full" />
        </div>
      </Card>
    )
  }

  return (
    <Card className="animate-fade-up stagger-5">
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <UserCheck className="h-3.5 w-3.5 text-[var(--color-accent-500)]" />
            내부자 거래
          </span>
        </CardTitle>
      </CardHeader>

      {activities.length === 0 ? (
        <p className="py-8 text-center text-sm text-[var(--color-text-tertiary)]">
          내부자 거래 내역이 없습니다
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border-subtle)]">
                <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                  날짜
                </th>
                <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                  이름
                </th>
                <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                  직위
                </th>
                <th className="pb-2 text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                  구분
                </th>
                <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                  변동
                </th>
                <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                  보유
                </th>
                <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                  지분율
                </th>
              </tr>
            </thead>
            <tbody>
              {activities.map((activity) => (
                <tr
                  key={activity.id}
                  className="table-row-hover border-b border-[var(--color-border-subtle)] last:border-0"
                >
                  <td className="py-2.5 font-mono text-xs text-[var(--color-text-secondary)]">
                    {activity.date}
                  </td>
                  <td className="py-2.5 font-medium text-[var(--color-text-primary)]">
                    {activity.name}
                  </td>
                  <td className="py-2.5 text-[var(--color-text-tertiary)]">
                    {activity.position}
                  </td>
                  <td className="py-2.5 text-center">
                    <TypeBadge type={activity.type} />
                  </td>
                  <td
                    className={`py-2.5 text-right tabular-nums font-medium ${
                      activity.type === "buy"
                        ? "text-[var(--color-gain)]"
                        : activity.type === "sell"
                          ? "text-[var(--color-loss)]"
                          : "text-[var(--color-text-secondary)]"
                    }`}
                  >
                    {activity.shares > 0 ? "+" : ""}
                    {formatShares(activity.shares)}
                  </td>
                  <td className="py-2.5 text-right tabular-nums text-[var(--color-text-secondary)]">
                    {formatShares(activity.totalShares)}
                  </td>
                  <td className="py-2.5 text-right tabular-nums text-[var(--color-text-secondary)]">
                    {activity.ratio.toFixed(2)}%
                    {activity.ratioChange !== 0 && (
                      <span
                        className={`ml-1 text-[10px] ${
                          activity.ratioChange > 0
                            ? "text-[var(--color-gain)]"
                            : "text-[var(--color-loss)]"
                        }`}
                      >
                        ({activity.ratioChange > 0 ? "+" : ""}
                        {activity.ratioChange.toFixed(2)}%)
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
