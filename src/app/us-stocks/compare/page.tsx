"use client"

import { Suspense, useState, useEffect, useMemo, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { PriceChange } from "@/components/ui/PriceChange"
import { Scale, X, Search } from "lucide-react"
import { searchUSStocks as searchRegistry } from "@/lib/data/us-stock-registry"

interface USStockData {
  readonly symbol: string
  readonly name: string
  readonly nameKr: string
  readonly price: number
  readonly change: number
  readonly changePercent: number
  readonly marketCap: number | null
  readonly pe: number | null
  readonly pb: number | null
  readonly dividendYield: number | null
  readonly week52High: number | null
  readonly week52Low: number | null
  readonly beta: number | null
  readonly sector: string
}

interface CompareItem {
  readonly stock: USStockData
}

const MAX_COMPARE = 4
const COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#8b5cf6"]

function USSearchInput({
  onAdd,
  disabled,
}: {
  readonly onAdd: (symbol: string) => void
  readonly disabled: boolean
}) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<{ symbol: string; nameKr: string }[]>([])
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    if (query.length < 1) {
      setResults([])
      return
    }

    const timer = setTimeout(() => {
      const found = searchRegistry(query, 5)
      setResults(found.map((s) => ({ symbol: s.symbol, nameKr: s.nameKr })))
    }, 200)

    return () => clearTimeout(timer)
  }, [query])

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border-default)] bg-white px-3 py-2">
        <Search size={14} className="text-[var(--color-text-muted)]" />
        <input
          type="text"
          placeholder="종목명 또는 심볼 입력"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setShowResults(true)
          }}
          onFocus={() => setShowResults(true)}
          disabled={disabled}
          className="w-full bg-transparent text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
        />
      </div>
      {showResults && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-xl border border-[var(--color-border-default)] bg-white shadow-lg">
          {results.map((r) => (
            <button
              key={r.symbol}
              type="button"
              onClick={() => {
                onAdd(r.symbol)
                setQuery("")
                setShowResults(false)
              }}
              className="flex w-full items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-[var(--color-surface-50)] first:rounded-t-xl last:rounded-b-xl"
            >
              <span className="text-[var(--color-text-primary)]">{r.nameKr}</span>
              <span className="font-mono text-xs text-[var(--color-text-tertiary)]">{r.symbol}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function USComparePage() {
  return (
    <Suspense fallback={<LoadingSkeleton className="h-96 w-full rounded-xl" />}>
      <USCompareContent />
    </Suspense>
  )
}

function USCompareContent() {
  const searchParams = useSearchParams()
  const [symbols, setSymbols] = useState<string[]>([])
  const [items, setItems] = useState<CompareItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const paramSymbols = searchParams.get("symbols")
    if (paramSymbols) {
      setSymbols(paramSymbols.split(",").slice(0, MAX_COMPARE))
    }
  }, [searchParams])

  useEffect(() => {
    if (symbols.length === 0) {
      setItems([])
      return
    }

    setLoading(true)

    async function fetchAll() {
      try {
        const results = await Promise.all(
          symbols.map(async (symbol) => {
            const res = await fetch(`/api/us-stocks/${symbol}`)
            const json = await res.json()
            if (json.success) {
              const d = json.data
              const q = d.quote ?? {}
              const m = d.metrics ?? {}
              return {
                stock: {
                  symbol: d.symbol,
                  name: d.name,
                  nameKr: d.nameKr ?? d.name,
                  price: q.price ?? 0,
                  change: q.change ?? 0,
                  changePercent: q.changePercent ?? 0,
                  marketCap: m.marketCap ?? null,
                  pe: m.pe ?? null,
                  pb: m.pb ?? null,
                  dividendYield: m.dividendYield ?? null,
                  week52High: m.fiftyTwoWeekHigh ?? null,
                  week52Low: m.fiftyTwoWeekLow ?? null,
                  beta: m.beta ?? null,
                  sector: d.sector ?? "",
                },
              } as CompareItem
            }
            return null
          })
        )
        setItems(results.filter((r): r is CompareItem => r !== null))
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [symbols])

  const handleAddSymbol = useCallback(
    (symbol: string) => {
      if (symbols.includes(symbol) || symbols.length >= MAX_COMPARE) return
      setSymbols((prev) => [...prev, symbol])
    },
    [symbols]
  )

  const handleRemoveSymbol = useCallback((symbol: string) => {
    setSymbols((prev) => prev.filter((s) => s !== symbol))
  }, [])

  const metrics = useMemo(() => {
    if (items.length === 0) return []
    return [
      { label: "현재가", key: "price" as const, format: (v: number | null) => v != null ? `$${v.toFixed(2)}` : "-" },
      { label: "등락률", key: "changePercent" as const, format: (v: number | null) => v != null ? `${v > 0 ? "+" : ""}${v.toFixed(2)}%` : "-" },
      { label: "시가총액", key: "marketCap" as const, format: (v: number | null) => v != null ? (v >= 1e12 ? `$${(v / 1e12).toFixed(2)}T` : `$${(v / 1e9).toFixed(1)}B`) : "-" },
      { label: "PER", key: "pe" as const, format: (v: number | null) => v != null ? v.toFixed(2) : "-" },
      { label: "PBR", key: "pb" as const, format: (v: number | null) => v != null ? v.toFixed(2) : "-" },
      { label: "배당수익률", key: "dividendYield" as const, format: (v: number | null) => v != null ? `${v.toFixed(2)}%` : "-" },
      { label: "Beta", key: "beta" as const, format: (v: number | null) => v != null ? v.toFixed(2) : "-" },
      { label: "52주 최고", key: "week52High" as const, format: (v: number | null) => v != null ? `$${v.toFixed(2)}` : "-" },
      { label: "52주 최저", key: "week52Low" as const, format: (v: number | null) => v != null ? `$${v.toFixed(2)}` : "-" },
    ]
  }, [items])

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          US 종목 비교
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
          최대 {MAX_COMPARE}개 종목을 나란히 비교하세요
        </p>
      </div>

      <div className="animate-fade-up stagger-2 flex flex-wrap items-center gap-3">
        {symbols.map((symbol, i) => {
          const item = items.find((it) => it.stock.symbol === symbol)
          return (
            <div
              key={symbol}
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm"
              style={{ borderColor: COLORS[i % COLORS.length] }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <Link
                href={`/us-stocks/${symbol}`}
                className="font-medium text-[var(--color-text-primary)] hover:underline"
              >
                {item?.stock.nameKr ?? symbol}
              </Link>
              <button
                type="button"
                onClick={() => handleRemoveSymbol(symbol)}
                className="rounded-full p-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
              >
                <X size={12} />
              </button>
            </div>
          )
        })}

        {symbols.length < MAX_COMPARE && (
          <div className="w-64">
            <USSearchInput
              onAdd={handleAddSymbol}
              disabled={symbols.length >= MAX_COMPARE}
            />
          </div>
        )}
      </div>

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2">
          <LoadingSkeleton className="h-48 rounded-xl" />
          <LoadingSkeleton className="h-48 rounded-xl" />
        </div>
      )}

      {!loading && items.length === 0 && (
        <Card className="animate-fade-up stagger-3">
          <div className="flex flex-col items-center py-16">
            <Scale className="mb-4 h-10 w-10 text-[var(--color-text-muted)]" />
            <p className="text-sm text-[var(--color-text-secondary)]">
              비교할 종목을 추가해주세요
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
              위 검색창에서 종목을 검색하여 추가할 수 있습니다
            </p>
          </div>
        </Card>
      )}

      {!loading && items.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-fade-up stagger-3">
            {items.map((item, i) => (
              <div
                key={item.stock.symbol}
                className="glass-card rounded-xl p-4"
                style={{ borderTop: `3px solid ${COLORS[i % COLORS.length]}` }}
              >
                <p className="text-xs font-medium text-[var(--color-text-tertiary)]">
                  {item.stock.nameKr}
                </p>
                <p className="mt-1 text-xl font-bold tabular-nums text-[var(--color-text-primary)]">
                  ${item.stock.price.toFixed(2)}
                </p>
                <PriceChange
                  change={item.stock.change}
                  changePercent={item.stock.changePercent}
                  className="mt-1 text-sm"
                />
              </div>
            ))}
          </div>

          <Card className="animate-fade-up stagger-5">
            <CardHeader>
              <CardTitle>
                <span className="flex items-center gap-2">
                  <Scale className="h-3.5 w-3.5 text-[var(--color-accent-500)]" />
                  지표 비교
                </span>
              </CardTitle>
            </CardHeader>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border-subtle)]">
                    <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      지표
                    </th>
                    {items.map((item, i) => (
                      <th
                        key={item.stock.symbol}
                        className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider"
                        style={{ color: COLORS[i % COLORS.length] }}
                      >
                        {item.stock.nameKr}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((metric) => (
                    <tr
                      key={metric.label}
                      className="table-row-hover border-b border-[var(--color-border-subtle)] last:border-0"
                    >
                      <td className="py-2.5 text-xs font-medium text-[var(--color-text-secondary)]">
                        {metric.label}
                      </td>
                      {items.map((item) => {
                        const value = item.stock[metric.key as keyof USStockData]
                        return (
                          <td
                            key={item.stock.symbol}
                            className="py-2.5 text-right tabular-nums font-medium text-[var(--color-text-primary)]"
                          >
                            {metric.format(value as number | null)}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
