"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { PresetButtons } from "./PresetButtons"
import { DividendStockTable } from "./DividendStockTable"
import { DividendFilterPanel } from "./DividendFilterPanel"
import type {
  DividendStock,
  DividendScreenerPreset,
  DividendScreenerFilters,
  DividendSortField,
  DividendMarket,
} from "@/lib/dividend/dividend-types"

const PAGE_SIZE = 20

export function DividendScreener() {
  const [stocks, setStocks] = useState<readonly DividendStock[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [preset, setPreset] = useState<DividendScreenerPreset | null>(null)
  const [market, setMarket] = useState<DividendMarket | "ALL">("ALL")
  const [sort, setSort] = useState<DividendSortField>("yield")
  const [order, setOrder] = useState<"asc" | "desc">("desc")
  const [filters, setFilters] = useState<Partial<DividendScreenerFilters>>({})

  const fetchStocks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/dividend-lab/screener", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          market,
          preset,
          filters,
          sort,
          order,
          page,
          limit: PAGE_SIZE,
        }),
      })
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`)
      }
      const json = await res.json()
      if (json.success) {
        setStocks(json.data)
        setTotal(json.meta?.total ?? 0)
      }
    } catch {
      setError("배당주 데이터를 불러오지 못했습니다.")
    } finally {
      setLoading(false)
    }
  }, [market, preset, filters, sort, order, page])

  useEffect(() => {
    fetchStocks()
  }, [fetchStocks])

  function handleSort(field: DividendSortField) {
    if (sort === field) {
      setOrder(order === "desc" ? "asc" : "desc")
    } else {
      setSort(field)
      setOrder("desc")
    }
    setPage(1)
  }

  function handlePresetChange(p: DividendScreenerPreset | null) {
    setPreset(p)
    setPage(1)
  }

  function handleMarketChange(m: DividendMarket | "ALL") {
    setMarket(m)
    setPage(1)
  }

  function handleFilterChange(f: Partial<DividendScreenerFilters>) {
    setFilters(f)
    setPage(1)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-4">
      <Card className="animate-fade-up stagger-1">
        <PresetButtons
          activePreset={preset}
          market={market}
          onPresetChange={handlePresetChange}
          onMarketChange={handleMarketChange}
        />
        <div className="mt-3">
          <DividendFilterPanel onFilterChange={handleFilterChange} />
        </div>
      </Card>

      <Card className="p-0 animate-fade-up stagger-2">
        <div className="p-5">
          {error && (
            <div className="mb-4 rounded-md bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
              <button
                type="button"
                onClick={fetchStocks}
                className="ml-2 underline hover:text-red-300"
              >
                재시도
              </button>
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <LoadingSkeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <>
              <div className="mb-4 text-xs text-[var(--color-text-tertiary)]">
                총{" "}
                <span className="font-medium tabular-nums text-[var(--color-text-secondary)]">
                  {total.toLocaleString()}
                </span>
                개 배당주
                {preset && (
                  <span className="ml-2 rounded bg-blue-500/10 px-2 py-0.5 text-blue-400">
                    {preset}
                  </span>
                )}
              </div>

              {stocks.length === 0 ? (
                <div className="py-12 text-center text-sm text-[var(--color-text-muted)]">
                  조건에 맞는 배당주가 없습니다.
                </div>
              ) : (
                <DividendStockTable
                  stocks={stocks}
                  sort={sort}
                  order={order}
                  onSort={handleSort}
                />
              )}

              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className={
                      "rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 " +
                      "bg-[var(--color-glass-2)] text-[var(--color-text-secondary)] " +
                      "ring-1 ring-[var(--color-border-subtle)] " +
                      "hover:bg-[var(--color-glass-3)] hover:text-[var(--color-text-primary)] " +
                      "disabled:cursor-not-allowed disabled:opacity-30"
                    }
                  >
                    이전
                  </button>
                  <span className="px-3 text-sm tabular-nums text-[var(--color-text-tertiary)]">
                    {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                    className={
                      "rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 " +
                      "bg-[var(--color-glass-2)] text-[var(--color-text-secondary)] " +
                      "ring-1 ring-[var(--color-border-subtle)] " +
                      "hover:bg-[var(--color-glass-3)] hover:text-[var(--color-text-primary)] " +
                      "disabled:cursor-not-allowed disabled:opacity-30"
                    }
                  >
                    다음
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  )
}
