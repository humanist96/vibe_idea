"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { UserCheck, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import type { InsiderActivity } from "@/lib/api/dart-insider-types"

interface InsiderActivityTableProps {
  readonly ticker: string
}

type SortKey = "date" | "name" | "position" | "type" | "shares" | "totalShares" | "ratio"
type SortDir = "asc" | "desc"

function TypeBadge({ type }: { readonly type: InsiderActivity["type"] }) {
  if (type === "buy") return <Badge variant="green">매수 ↑</Badge>
  if (type === "sell") return <Badge variant="red">매도 ↓</Badge>
  return <Badge variant="gray">기타</Badge>
}

function formatShares(shares: number): string {
  const abs = Math.abs(shares)
  if (abs >= 100_000_000) return `${(abs / 100_000_000).toFixed(1)}억`
  if (abs >= 10_000) return `${(abs / 10_000).toFixed(1)}만`
  return abs.toLocaleString("ko-KR")
}

const TYPE_ORDER: Record<string, number> = { buy: 0, sell: 1, other: 2 }

function compareActivities(a: InsiderActivity, b: InsiderActivity, key: SortKey, dir: SortDir): number {
  let cmp = 0
  switch (key) {
    case "date": cmp = a.date.localeCompare(b.date); break
    case "name": cmp = a.name.localeCompare(b.name); break
    case "position": cmp = a.position.localeCompare(b.position); break
    case "type": cmp = (TYPE_ORDER[a.type] ?? 2) - (TYPE_ORDER[b.type] ?? 2); break
    case "shares": cmp = a.shares - b.shares; break
    case "totalShares": cmp = a.totalShares - b.totalShares; break
    case "ratio": cmp = a.ratio - b.ratio; break
  }
  return dir === "asc" ? cmp : -cmp
}

function SortIcon({ active, dir }: { readonly active: boolean; readonly dir: SortDir }) {
  if (!active) {
    return <ChevronDown className="h-3 w-3 text-[var(--color-text-muted)]" />
  }
  return dir === "asc"
    ? <ChevronUp className="h-3 w-3 text-[var(--color-accent-500)]" />
    : <ChevronDown className="h-3 w-3 text-[var(--color-accent-500)]" />
}

interface SortableThProps {
  readonly label: string
  readonly sortKey: SortKey
  readonly currentKey: SortKey
  readonly currentDir: SortDir
  readonly onSort: (key: SortKey) => void
  readonly align?: "left" | "center" | "right"
}

function SortableTh({ label, sortKey, currentKey, currentDir, onSort, align = "left" }: SortableThProps) {
  const alignClass = align === "right" ? "justify-end" : align === "center" ? "justify-center" : "justify-start"
  return (
    <th className={cn("pb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]", align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left")}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn("inline-flex items-center gap-0.5 transition-colors hover:text-[var(--color-text-secondary)]", alignClass)}
      >
        {label}
        <SortIcon active={currentKey === sortKey} dir={currentDir} />
      </button>
    </th>
  )
}

export function InsiderActivityTable({ ticker }: InsiderActivityTableProps) {
  const [activities, setActivities] = useState<InsiderActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>("date")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 10

  useEffect(() => {
    async function fetchInsider() {
      try {
        setError(null)
        const res = await fetch(`/api/stocks/${ticker}/insider`)
        const json = await res.json()
        if (json.success) {
          setActivities(json.data)
        } else {
          setError(json.error ?? "데이터를 불러오는데 실패했습니다")
        }
      } catch (err) {
        console.error("[InsiderActivityTable] fetch failed:", err)
        setError("서버 연결에 실패했습니다")
      } finally {
        setLoading(false)
      }
    }
    fetchInsider()
  }, [ticker])

  const handleSort = useCallback((key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"))
        return key
      }
      setSortDir("desc")
      return key
    })
  }, [])

  const sorted = useMemo(
    () => [...activities].sort((a, b) => compareActivities(a, b, sortKey, sortDir)),
    [activities, sortKey, sortDir]
  )

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

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

      {error ? (
        <p className="py-8 text-center text-sm text-red-500">
          {error}
        </p>
      ) : activities.length === 0 ? (
        <p className="py-8 text-center text-sm text-[var(--color-text-tertiary)]">
          내부자 거래 내역이 없습니다
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border-subtle)]">
                <SortableTh label="날짜" sortKey="date" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                <SortableTh label="이름" sortKey="name" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                <SortableTh label="직위" sortKey="position" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                <SortableTh label="구분" sortKey="type" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} align="center" />
                <SortableTh label="변동" sortKey="shares" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} align="right" />
                <SortableTh label="보유" sortKey="totalShares" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} align="right" />
                <SortableTh label="지분율" sortKey="ratio" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} align="right" />
              </tr>
            </thead>
            <tbody>
              {paged.map((activity) => (
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

          {totalPages > 1 && (
            <div className="mt-3 flex items-center justify-between border-t border-[var(--color-border-subtle)] pt-3">
              <span className="text-[10px] text-[var(--color-text-tertiary)]">
                {page * PAGE_SIZE + 1}~{Math.min((page + 1) * PAGE_SIZE, sorted.length)}건 / 총 {sorted.length}건
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="rounded p-1 transition-colors hover:bg-[var(--color-surface-elevated)] disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4 text-[var(--color-text-secondary)]" />
                </button>
                <span className="px-2 text-xs text-[var(--color-text-secondary)]">
                  {page + 1} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="rounded p-1 transition-colors hover:bg-[var(--color-surface-elevated)] disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4 text-[var(--color-text-secondary)]" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
