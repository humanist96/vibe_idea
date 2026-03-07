"use client"

import { Suspense, useState, useEffect, useMemo, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { PriceChange } from "@/components/ui/PriceChange"
import { Scale, X, Search } from "lucide-react"
import { formatNumber, formatCurrency, formatPercent, formatMarketCap } from "@/lib/utils/format"
import { ComparisonRadar } from "@/components/compare/ComparisonRadar"

interface StockData {
  readonly ticker: string
  readonly name: string
  readonly price: number
  readonly change: number
  readonly changePercent: number
  readonly volume: number
  readonly marketCap: number
  readonly per: number | null
  readonly pbr: number | null
  readonly eps: number | null
  readonly dividendYield: number | null
  readonly fiftyTwoWeekHigh: number
  readonly fiftyTwoWeekLow: number
  readonly market: "KOSPI" | "KOSDAQ"
  readonly sector: string
}

interface AIScoreData {
  readonly aiScore: number
  readonly technicalScore: number
  readonly fundamentalScore: number
  readonly sentimentScore: number
  readonly riskScore: number
  readonly rating: string
}

interface CompareItem {
  readonly stock: StockData
  readonly aiScore: AIScoreData | null
}

const MAX_COMPARE = 4
const COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#8b5cf6"]

function SearchInput({
  onAdd,
  disabled,
}: {
  readonly onAdd: (ticker: string) => void
  readonly disabled: boolean
}) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<{ ticker: string; name: string }[]>([])
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const json = await res.json()
        if (json.success) setResults(json.data.slice(0, 5))
      } catch {
        // silently fail
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border-default)] bg-white px-3 py-2">
        <Search size={14} className="text-[var(--color-text-muted)]" />
        <input
          type="text"
          placeholder="종목명 또는 코드 입력"
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
              key={r.ticker}
              type="button"
              onClick={() => {
                onAdd(r.ticker)
                setQuery("")
                setShowResults(false)
              }}
              className="flex w-full items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-[var(--color-surface-50)] first:rounded-t-xl last:rounded-b-xl"
            >
              <span className="text-[var(--color-text-primary)]">{r.name}</span>
              <span className="font-mono text-xs text-[var(--color-text-tertiary)]">{r.ticker}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ComparePage() {
  return (
    <Suspense fallback={<LoadingSkeleton className="h-96 w-full rounded-xl" />}>
      <CompareContent />
    </Suspense>
  )
}

function CompareContent() {
  const searchParams = useSearchParams()
  const [tickers, setTickers] = useState<string[]>([])
  const [items, setItems] = useState<CompareItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const paramTickers = searchParams.get("tickers")
    if (paramTickers) {
      setTickers(paramTickers.split(",").slice(0, MAX_COMPARE))
    }
  }, [searchParams])

  useEffect(() => {
    if (tickers.length === 0) {
      setItems([])
      return
    }

    setLoading(true)

    async function fetchAll() {
      try {
        const results = await Promise.all(
          tickers.map(async (ticker) => {
            const [stockRes, scoreRes] = await Promise.all([
              fetch(`/api/stocks/${ticker}`),
              fetch(`/api/ai-score/${ticker}`),
            ])

            const stockJson = await stockRes.json()
            let aiScore: AIScoreData | null = null

            try {
              const scoreJson = await scoreRes.json()
              if (scoreJson.success && scoreJson.data) {
                aiScore = scoreJson.data
              }
            } catch {
              // AI score not available
            }

            if (stockJson.success) {
              return { stock: stockJson.data, aiScore } as CompareItem
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
  }, [tickers])

  const handleAddTicker = useCallback(
    (ticker: string) => {
      if (tickers.includes(ticker) || tickers.length >= MAX_COMPARE) return
      setTickers((prev) => [...prev, ticker])
    },
    [tickers]
  )

  const handleRemoveTicker = useCallback((ticker: string) => {
    setTickers((prev) => prev.filter((t) => t !== ticker))
  }, [])

  const metrics = useMemo(() => {
    if (items.length === 0) return []
    return [
      { label: "현재가", key: "price" as const, format: (v: number) => formatCurrency(v) },
      { label: "등락률", key: "changePercent" as const, format: (v: number) => formatPercent(v) },
      { label: "시가총액", key: "marketCap" as const, format: (v: number) => formatMarketCap(v) },
      { label: "거래량", key: "volume" as const, format: (v: number) => formatNumber(v) },
      { label: "PER", key: "per" as const, format: (v: number | null) => v ? v.toFixed(2) : "-" },
      { label: "PBR", key: "pbr" as const, format: (v: number | null) => v ? v.toFixed(2) : "-" },
      { label: "EPS", key: "eps" as const, format: (v: number | null) => v ? formatNumber(v) : "-" },
      { label: "배당수익률", key: "dividendYield" as const, format: (v: number | null) => v ? `${v.toFixed(2)}%` : "-" },
      { label: "52주 최고", key: "fiftyTwoWeekHigh" as const, format: (v: number) => formatCurrency(v) },
      { label: "52주 최저", key: "fiftyTwoWeekLow" as const, format: (v: number) => formatCurrency(v) },
    ]
  }, [items])

  const radarItems = useMemo(
    () =>
      items
        .filter((item) => item.aiScore !== null)
        .map((item, i) => ({
          name: item.stock.name,
          color: COLORS[i % COLORS.length],
          technical: item.aiScore!.technicalScore,
          fundamental: item.aiScore!.fundamentalScore,
          sentiment: item.aiScore!.sentimentScore,
          risk: item.aiScore!.riskScore,
        })),
    [items]
  )

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          종목 비교
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
          최대 {MAX_COMPARE}개 종목을 나란히 비교하세요
        </p>
      </div>

      {/* Ticker selection */}
      <div className="animate-fade-up stagger-2 flex flex-wrap items-center gap-3">
        {tickers.map((ticker, i) => {
          const item = items.find((it) => it.stock.ticker === ticker)
          return (
            <div
              key={ticker}
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm"
              style={{ borderColor: COLORS[i % COLORS.length] }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <Link
                href={`/stock/${ticker}`}
                className="font-medium text-[var(--color-text-primary)] hover:underline"
              >
                {item?.stock.name ?? ticker}
              </Link>
              <button
                type="button"
                onClick={() => handleRemoveTicker(ticker)}
                className="rounded-full p-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
              >
                <X size={12} />
              </button>
            </div>
          )
        })}

        {tickers.length < MAX_COMPARE && (
          <div className="w-64">
            <SearchInput
              onAdd={handleAddTicker}
              disabled={tickers.length >= MAX_COMPARE}
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
          {/* Price summary cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-fade-up stagger-3">
            {items.map((item, i) => (
              <div
                key={item.stock.ticker}
                className="glass-card rounded-xl p-4"
                style={{ borderTop: `3px solid ${COLORS[i % COLORS.length]}` }}
              >
                <p className="text-xs font-medium text-[var(--color-text-tertiary)]">
                  {item.stock.name}
                </p>
                <p className="mt-1 text-xl font-bold tabular-nums text-[var(--color-text-primary)]">
                  {formatCurrency(item.stock.price)}
                </p>
                <PriceChange
                  change={item.stock.change}
                  changePercent={item.stock.changePercent}
                  className="mt-1 text-sm"
                />
                {item.aiScore && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="text-[10px] text-[var(--color-text-tertiary)]">AI 점수</span>
                    <span className="text-sm font-bold text-[var(--color-accent-400)]">
                      {item.aiScore.aiScore}
                    </span>
                    <span className="text-[10px] text-[var(--color-text-muted)]">
                      {item.aiScore.rating}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* AI Score Radar */}
          {radarItems.length >= 2 && (
            <Card className="animate-fade-up stagger-4">
              <CardHeader>
                <CardTitle>AI 분석 비교</CardTitle>
              </CardHeader>
              <ComparisonRadar items={radarItems} />
            </Card>
          )}

          {/* Comparison Table */}
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
                        key={item.stock.ticker}
                        className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider"
                        style={{ color: COLORS[i % COLORS.length] }}
                      >
                        {item.stock.name}
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
                        const value = item.stock[metric.key as keyof StockData]
                        return (
                          <td
                            key={item.stock.ticker}
                            className="py-2.5 text-right tabular-nums font-medium text-[var(--color-text-primary)]"
                          >
                            {metric.format(value as never)}
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
