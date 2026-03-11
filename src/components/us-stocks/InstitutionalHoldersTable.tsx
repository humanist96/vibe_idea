"use client"

import Link from "next/link"
import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { Building2 } from "lucide-react"
import { cn } from "@/lib/utils/cn"

interface HolderRow {
  readonly name: string
  readonly shares: number
  readonly change: number
  readonly changePercent: number
  readonly filingDate: string
}

interface TickerHolding {
  readonly ticker: string
  readonly topHolders: readonly HolderRow[]
  readonly totalInstitutional: number
  readonly institutionalPercent: number
}

interface InstitutionalHoldersTableProps {
  readonly holdings: readonly TickerHolding[]
}

function formatShares(v: number): string {
  const abs = Math.abs(v)
  if (abs >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(2)}B`
  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${(v / 1_000).toFixed(0)}K`
  return v.toLocaleString()
}

export function InstitutionalHoldersTable({
  holdings,
}: InstitutionalHoldersTableProps) {
  if (holdings.length === 0) {
    return (
      <Card>
        <div className="py-12 text-center text-sm text-[var(--color-text-muted)]">
          기관 보유 데이터가 없습니다.
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {holdings.map((holding) => (
        <Card key={holding.ticker} className="animate-fade-up">
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-[var(--color-accent-500)]" />
                <Link
                  href={`/us-stocks/${holding.ticker}`}
                  className="text-[var(--color-accent-500)] transition-colors hover:text-[var(--color-accent-400)]"
                >
                  {holding.ticker}
                </Link>
                <span className="text-xs font-normal text-[var(--color-text-tertiary)]">
                  기관 보유 {holding.institutionalPercent}%
                </span>
              </span>
            </CardTitle>
          </CardHeader>

          {holding.topHolders.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">
              보유 데이터 없음
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border-subtle)]">
                    <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      기관명
                    </th>
                    <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      보유 주수
                    </th>
                    <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      변화
                    </th>
                    <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      변화율
                    </th>
                    <th className="pb-2 text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      공시일
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {holding.topHolders.map((h, i) => (
                    <tr
                      key={`${holding.ticker}-${i}`}
                      className="table-row-hover border-b border-[var(--color-border-subtle)] last:border-0"
                    >
                      <td className="py-2.5 text-xs font-medium text-[var(--color-text-primary)]">
                        {h.name}
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-xs text-[var(--color-text-secondary)]">
                        {formatShares(h.shares)}
                      </td>
                      <td
                        className={cn(
                          "py-2.5 text-right tabular-nums text-xs",
                          h.change > 0
                            ? "text-[var(--color-gain)]"
                            : h.change < 0
                              ? "text-[var(--color-loss)]"
                              : "text-[var(--color-text-tertiary)]"
                        )}
                      >
                        {h.change > 0 ? "+" : ""}
                        {formatShares(h.change)}
                      </td>
                      <td
                        className={cn(
                          "py-2.5 text-right tabular-nums text-xs",
                          h.changePercent > 0
                            ? "text-[var(--color-gain)]"
                            : h.changePercent < 0
                              ? "text-[var(--color-loss)]"
                              : "text-[var(--color-text-tertiary)]"
                        )}
                      >
                        {h.changePercent > 0 ? "+" : ""}
                        {h.changePercent.toFixed(2)}%
                      </td>
                      <td className="py-2.5 text-center text-xs text-[var(--color-text-muted)]">
                        {h.filingDate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}
