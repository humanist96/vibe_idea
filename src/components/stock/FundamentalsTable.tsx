"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"

type PeriodType = "annual" | "quarter"

interface FinanceColumn {
  readonly title: string
  readonly isConsensus: boolean
}

interface FinanceRow {
  readonly title: string
  readonly values: readonly (string | null)[]
}

interface FinanceData {
  readonly columns: readonly FinanceColumn[]
  readonly rows: readonly FinanceRow[]
}

function formatValue(value: string | null): string {
  if (value === null || value === "") return "--"
  return value
}

interface FundamentalsTableProps {
  readonly ticker: string
}

export function FundamentalsTable({ ticker }: FundamentalsTableProps) {
  const [period, setPeriod] = useState<PeriodType>("annual")
  const [data, setData] = useState<FinanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFinance = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/stocks/${ticker}/finance?period=${period}`)
      const json = await res.json()
      if (json.success && json.data) {
        setData(json.data)
      } else {
        setError("재무 데이터가 없습니다.")
      }
    } catch {
      setError("재무 데이터를 불러올 수 없습니다.")
    } finally {
      setLoading(false)
    }
  }, [ticker, period])

  useEffect(() => {
    fetchFinance()
  }, [fetchFinance])

  return (
    <Card className="animate-fade-up stagger-5">
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <CardTitle>재무제표</CardTitle>
          <div className="flex gap-1">
            <Button
              variant={period === "annual" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setPeriod("annual")}
            >
              연간
            </Button>
            <Button
              variant={period === "quarter" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setPeriod("quarter")}
            >
              분기
            </Button>
          </div>
        </div>
      </CardHeader>

      {loading && (
        <div className="space-y-2 py-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="text-center py-8 text-sm text-[var(--color-text-muted)]">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && data && data.rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border-subtle)]">
                <th className="py-2 text-left text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-muted)] sticky left-0 bg-[var(--color-surface-50)]">
                  항목
                </th>
                {data.columns.map((col, i) => (
                  <th
                    key={i}
                    className={`py-2 text-right text-[10px] font-medium uppercase tracking-widest whitespace-nowrap ${
                      col.isConsensus
                        ? "text-[var(--color-accent-400)]"
                        : "text-[var(--color-text-muted)]"
                    }`}
                  >
                    {col.title}
                    {col.isConsensus && (
                      <span className="ml-0.5 text-[8px]">(E)</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr
                  key={row.title}
                  className="table-row-hover border-b border-[var(--color-border-subtle)]"
                >
                  <td className="py-2 text-sm font-medium text-[var(--color-text-secondary)] sticky left-0 bg-[var(--color-surface-50)] whitespace-nowrap">
                    {row.title}
                  </td>
                  {row.values.map((val, i) => {
                    const isConsensus = data.columns[i]?.isConsensus ?? false
                    return (
                      <td
                        key={i}
                        className={`py-2 text-right tabular-nums whitespace-nowrap ${
                          isConsensus
                            ? "text-[var(--color-accent-300)] bg-[var(--color-accent-400)]/5"
                            : i === 0
                              ? "text-[var(--color-text-primary)]"
                              : "text-[var(--color-text-tertiary)]"
                        }`}
                      >
                        {formatValue(val)}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="py-2 text-[10px] text-[var(--color-text-muted)] text-right">
            출처: Naver Finance {period === "annual" ? "(연간)" : "(분기)"} · (E)는 컨센서스 추정치
          </p>
        </div>
      )}

      {!loading && !error && (!data || data.rows.length === 0) && (
        <div className="text-center py-8 text-sm text-[var(--color-text-muted)]">
          <p>재무 데이터가 없습니다.</p>
        </div>
      )}
    </Card>
  )
}
