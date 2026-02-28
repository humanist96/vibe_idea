"use client"

import { Suspense, useEffect, useState, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/Card"
import { FilterPanel, type Filters } from "@/components/screener/FilterPanel"
import { StockTable } from "@/components/screener/StockTable"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"

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

  const currentPage = Number(searchParams.get("page")) || 1
  const currentMarket =
    (searchParams.get("market") as "ALL" | "KOSPI" | "KOSDAQ") || "ALL"
  const currentSector = searchParams.get("sector") ?? ""
  const currentSort = searchParams.get("sort") ?? "marketCap"
  const currentOrder = (searchParams.get("order") as "asc" | "desc") || "desc"

  const filters: Filters = {
    market: currentMarket,
    sector: currentSector,
    minPrice: searchParams.get("minPrice") ?? "",
    maxPrice: searchParams.get("maxPrice") ?? "",
    minPer: searchParams.get("minPer") ?? "",
    maxPer: searchParams.get("maxPer") ?? "",
  }

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
      updateUrl({
        page: "1",
        market: newFilters.market === "ALL" ? "" : newFilters.market,
        sector: newFilters.sector,
        minPrice: newFilters.minPrice,
        maxPrice: newFilters.maxPrice,
        minPer: newFilters.minPer,
        maxPer: newFilters.maxPer,
      })
    },
    [updateUrl]
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
        if (currentMarket !== "ALL") params.set("market", currentMarket)
        if (currentSector) params.set("sector", currentSector)
        params.set("sort", currentSort)
        params.set("order", currentOrder)

        const minPrice = searchParams.get("minPrice")
        const maxPrice = searchParams.get("maxPrice")
        const minPer = searchParams.get("minPer")
        const maxPer = searchParams.get("maxPer")

        const res = await fetch(`/api/stocks?${params.toString()}`)
        const json = await res.json()
        if (json.success) {
          let data: StockData[] = json.data
          if (minPrice) {
            const min = Number(minPrice)
            if (!isNaN(min)) data = data.filter((s) => s.price >= min)
          }
          if (maxPrice) {
            const max = Number(maxPrice)
            if (!isNaN(max)) data = data.filter((s) => s.price <= max)
          }
          if (minPer) {
            const min = Number(minPer)
            if (!isNaN(min)) data = data.filter((s) => s.per !== null && s.per >= min)
          }
          if (maxPer) {
            const max = Number(maxPer)
            if (!isNaN(max)) data = data.filter((s) => s.per !== null && s.per <= max)
          }
          setStocks(data)
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
  }, [currentPage, currentMarket, currentSector, currentSort, currentOrder, searchParams])

  return (
    <>
      <Card className="animate-fade-up stagger-2">
        <FilterPanel
          filters={filters}
          onFilterChange={handleFilterChange}
          sectors={sectors}
        />
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
