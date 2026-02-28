"use client"

import { useEffect, useState, useMemo } from "react"
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
  readonly aiScore: number | null
  readonly market: "KOSPI" | "KOSDAQ"
  readonly sector: string
}

const defaultFilters: Filters = {
  market: "ALL",
  sector: "",
  minScore: 1,
  maxScore: 10,
  minPrice: "",
  maxPrice: "",
}

export default function ScreenerPage() {
  const [stocks, setStocks] = useState<StockData[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Filters>(defaultFilters)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/stocks")
        const json = await res.json()
        if (json.success) {
          setStocks(json.data)
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filtered = useMemo(() => {
    return stocks.filter((stock) => {
      if (filters.market !== "ALL" && stock.market !== filters.market) {
        return false
      }
      if (filters.sector && stock.sector !== filters.sector) {
        return false
      }
      if (filters.minPrice) {
        const min = Number(filters.minPrice)
        if (!isNaN(min) && stock.price < min) return false
      }
      if (filters.maxPrice) {
        const max = Number(filters.maxPrice)
        if (!isNaN(max) && stock.price > max) return false
      }
      return true
    })
  }, [stocks, filters])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">스크리너</h1>
        <p className="mt-1 text-sm text-gray-500">
          AI 점수 기반 종목 필터링 및 비교
        </p>
      </div>

      <Card>
        <FilterPanel filters={filters} onFilterChange={setFilters} />
      </Card>

      <Card className="p-0">
        <div className="p-5">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <LoadingSkeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-gray-500">
                {filtered.length}개 종목
              </div>
              <StockTable stocks={filtered} />
            </>
          )}
        </div>
      </Card>
    </div>
  )
}
