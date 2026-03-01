"use client"

import { Suspense, useEffect, useState, useCallback, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/Card"
import { FilterPanel, type Filters, EMPTY_FILTERS } from "@/components/screener/FilterPanel"
import { QuickPresets } from "@/components/screener/QuickPresets"
import { SavedPresets } from "@/components/screener/SavedPresets"
import { StockTable } from "@/components/screener/StockTable"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { useScreenerDefaultsStore } from "@/store/screener-defaults"

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
  readonly dividendYield: number | null
  readonly market: "KOSPI" | "KOSDAQ"
  readonly sector: string
}

interface Meta {
  readonly total: number
  readonly page: number
  readonly limit: number
  readonly totalPages: number
}

const FILTER_KEYS: readonly (keyof Filters)[] = [
  "market", "sector", "minPrice", "maxPrice", "minPer", "maxPer",
  "minPbr", "maxPbr", "minDividendYield", "maxDividendYield",
  "minChangePercent", "maxChangePercent", "minMarketCap", "maxMarketCap",
  "minForeignRate",
]

function filtersFromSearchParams(sp: URLSearchParams, defaults: Record<string, string>): Filters {
  const hasAnyParam = FILTER_KEYS.some((k) => sp.has(k)) || sp.has("page") || sp.has("sort") || sp.has("order")

  if (hasAnyParam) {
    return {
      market: (sp.get("market") as Filters["market"]) || "ALL",
      sector: sp.get("sector") ?? "",
      minPrice: sp.get("minPrice") ?? "",
      maxPrice: sp.get("maxPrice") ?? "",
      minPer: sp.get("minPer") ?? "",
      maxPer: sp.get("maxPer") ?? "",
      minPbr: sp.get("minPbr") ?? "",
      maxPbr: sp.get("maxPbr") ?? "",
      minDividendYield: sp.get("minDividendYield") ?? "",
      maxDividendYield: sp.get("maxDividendYield") ?? "",
      minChangePercent: sp.get("minChangePercent") ?? "",
      maxChangePercent: sp.get("maxChangePercent") ?? "",
      minMarketCap: sp.get("minMarketCap") ?? "",
      maxMarketCap: sp.get("maxMarketCap") ?? "",
      minForeignRate: sp.get("minForeignRate") ?? "",
    }
  }

  return {
    ...EMPTY_FILTERS,
    market: (defaults.market as Filters["market"]) || "ALL",
    sector: defaults.sector || "",
    minPrice: defaults.minPrice || "",
    maxPrice: defaults.maxPrice || "",
    minPer: defaults.minPer || "",
    maxPer: defaults.maxPer || "",
    minPbr: defaults.minPbr || "",
    maxPbr: defaults.maxPbr || "",
    minDividendYield: defaults.minDividendYield || "",
    maxDividendYield: defaults.maxDividendYield || "",
    minChangePercent: defaults.minChangePercent || "",
    maxChangePercent: defaults.maxChangePercent || "",
    minMarketCap: defaults.minMarketCap || "",
    maxMarketCap: defaults.maxMarketCap || "",
    minForeignRate: defaults.minForeignRate || "",
  }
}

function filtersToRecord(filters: Filters): Record<string, string> {
  const record: Record<string, string> = {}
  for (const [key, value] of Object.entries(filters)) {
    if (value && value !== "ALL") record[key] = value
  }
  return record
}

function ScreenerContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [stocks, setStocks] = useState<StockData[]>([])
  const [sectors, setSectors] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [meta, setMeta] = useState<Meta>({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 1,
  })

  const { lastFilters, lastSort, lastOrder, saveDefaults } = useScreenerDefaultsStore()
  const defaultsRestoredRef = useRef(false)

  const currentSort = searchParams.get("sort") ?? lastSort
  const currentOrder = (searchParams.get("order") as "asc" | "desc") || lastOrder

  const filters = filtersFromSearchParams(searchParams, lastFilters)

  const currentPage = Number(searchParams.get("page")) || 1

  // Restore defaults on first mount if no URL params
  useEffect(() => {
    if (defaultsRestoredRef.current) return
    defaultsRestoredRef.current = true

    const hasUrlParams = Array.from(searchParams.keys()).length > 0
    if (!hasUrlParams && Object.keys(lastFilters).length > 0) {
      const params = new URLSearchParams()
      for (const [key, value] of Object.entries(lastFilters)) {
        if (value) params.set(key, value)
      }
      if (lastSort !== "marketCap") params.set("sort", lastSort)
      if (lastOrder !== "desc") params.set("order", lastOrder)
      if (params.toString()) {
        router.replace(`/screener?${params.toString()}`)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const updateUrl = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      }
      router.push(`/screener?${params.toString()}`)
    },
    [searchParams, router]
  )

  const handleFilterChange = useCallback(
    (newFilters: Filters) => {
      const record = filtersToRecord(newFilters)
      saveDefaults(record, currentSort, currentOrder)

      const updates: Record<string, string> = { page: "1" }
      for (const key of FILTER_KEYS) {
        updates[key] = key === "market" && newFilters[key] === "ALL" ? "" : newFilters[key]
      }
      updateUrl(updates)
    },
    [updateUrl, saveDefaults, currentSort, currentOrder]
  )

  const handlePageChange = useCallback(
    (page: number) => {
      updateUrl({ page: String(page) })
    },
    [updateUrl]
  )

  useEffect(() => {
    async function fetchSectors() {
      try {
        const res = await fetch("/api/sectors")
        const json = await res.json()
        if (json.success) {
          setSectors(json.data)
        }
      } catch {
        // use empty array
      }
    }
    fetchSectors()
  }, [])

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.set("page", String(currentPage))
        params.set("limit", "50")

        if (filters.market !== "ALL") params.set("market", filters.market)
        if (filters.sector) params.set("sector", filters.sector)
        params.set("sort", currentSort)
        params.set("order", currentOrder)

        // Tier 1 params (server-side in registry)
        if (filters.minPrice) params.set("minPrice", filters.minPrice)
        if (filters.maxPrice) params.set("maxPrice", filters.maxPrice)
        if (filters.minChangePercent) params.set("minChangePercent", filters.minChangePercent)
        if (filters.maxChangePercent) params.set("maxChangePercent", filters.maxChangePercent)
        if (filters.minMarketCap) params.set("minMarketCap", filters.minMarketCap)
        if (filters.maxMarketCap) params.set("maxMarketCap", filters.maxMarketCap)

        // Tier 2 params (server-side post-enrichment)
        if (filters.minPer) params.set("minPer", filters.minPer)
        if (filters.maxPer) params.set("maxPer", filters.maxPer)
        if (filters.minPbr) params.set("minPbr", filters.minPbr)
        if (filters.maxPbr) params.set("maxPbr", filters.maxPbr)
        if (filters.minDividendYield) params.set("minDividendYield", filters.minDividendYield)
        if (filters.maxDividendYield) params.set("maxDividendYield", filters.maxDividendYield)
        if (filters.minForeignRate) params.set("minForeignRate", filters.minForeignRate)

        const res = await fetch(`/api/stocks?${params.toString()}`)
        const json = await res.json()
        if (json.success) {
          setStocks(json.data)
          if (json.meta) {
            setMeta(json.meta)
          }
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchData()
    // Save current filter state
    saveDefaults(filtersToRecord(filters), currentSort, currentOrder)
  }, [currentPage, filters.market, filters.sector, currentSort, currentOrder,
      filters.minPrice, filters.maxPrice, filters.minPer, filters.maxPer,
      filters.minPbr, filters.maxPbr, filters.minDividendYield, filters.maxDividendYield,
      filters.minChangePercent, filters.maxChangePercent,
      filters.minMarketCap, filters.maxMarketCap, filters.minForeignRate]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <Card className="animate-fade-up stagger-2">
        <div className="space-y-3">
          <FilterPanel
            filters={filters}
            onFilterChange={handleFilterChange}
            sectors={sectors}
          />
          <div className="flex flex-wrap items-center gap-4 border-t border-[var(--color-border-subtle)] pt-3">
            <QuickPresets onApply={handleFilterChange} />
            <div className="h-4 w-px bg-[var(--color-border-subtle)] hidden sm:block" />
            <SavedPresets currentFilters={filters} onLoad={handleFilterChange} />
          </div>
        </div>
      </Card>

      <Card className="p-0 animate-fade-up stagger-3">
        <div className="p-5">
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
                  {meta.total.toLocaleString()}
                </span>
                개 종목 중{" "}
                <span className="font-medium tabular-nums text-[var(--color-text-secondary)]">
                  {stocks.length}
                </span>
                개 표시
                <span className="mx-2 text-[var(--color-text-muted)]">/</span>
                페이지{" "}
                <span className="tabular-nums text-[var(--color-text-secondary)]">
                  {meta.page}
                </span>
                {" / "}
                <span className="tabular-nums text-[var(--color-text-secondary)]">
                  {meta.totalPages}
                </span>
              </div>

              <StockTable stocks={stocks} />

              {meta.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    disabled={meta.page <= 1}
                    onClick={() => handlePageChange(meta.page - 1)}
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
                    {meta.page} / {meta.totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={meta.page >= meta.totalPages}
                    onClick={() => handlePageChange(meta.page + 1)}
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
    </>
  )
}

export default function ScreenerPage() {
  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          스크리너
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
          전 종목 필터링 및 비교
        </p>
      </div>

      <Suspense
        fallback={
          <Card className="p-0">
            <div className="space-y-3 p-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <LoadingSkeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </Card>
        }
      >
        <ScreenerContent />
      </Suspense>
    </div>
  )
}
