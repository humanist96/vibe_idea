"use client"

import { Button } from "@/components/ui/Button"
import { SECTORS } from "@/lib/constants/stocks"

export interface Filters {
  readonly market: "ALL" | "KOSPI" | "KOSDAQ"
  readonly sector: string
  readonly minScore: number
  readonly maxScore: number
  readonly minPrice: string
  readonly maxPrice: string
}

interface FilterPanelProps {
  readonly filters: Filters
  readonly onFilterChange: (filters: Filters) => void
}

export function FilterPanel({ filters, onFilterChange }: FilterPanelProps) {
  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    onFilterChange({ ...filters, [key]: value })
  }

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">
          시장
        </label>
        <div className="flex gap-1">
          {(["ALL", "KOSPI", "KOSDAQ"] as const).map((market) => (
            <Button
              key={market}
              variant={filters.market === market ? "primary" : "secondary"}
              size="sm"
              onClick={() => updateFilter("market", market)}
            >
              {market === "ALL" ? "전체" : market}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">
          섹터
        </label>
        <select
          value={filters.sector}
          onChange={(e) => updateFilter("sector", e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-blue-500"
        >
          <option value="">전체</option>
          {SECTORS.map((sector) => (
            <option key={sector} value={sector}>
              {sector}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">
          AI 점수 범위
        </label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={filters.minScore}
            onChange={(e) => updateFilter("minScore", Number(e.target.value))}
            className="w-20"
          />
          <span className="text-xs text-gray-500">
            {filters.minScore} - {filters.maxScore}
          </span>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={filters.maxScore}
            onChange={(e) => updateFilter("maxScore", Number(e.target.value))}
            className="w-20"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">
          가격 범위 (원)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={filters.minPrice}
            onChange={(e) => updateFilter("minPrice", e.target.value)}
            placeholder="최소"
            className="w-24 rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
          />
          <span className="text-gray-400">~</span>
          <input
            type="text"
            value={filters.maxPrice}
            onChange={(e) => updateFilter("maxPrice", e.target.value)}
            placeholder="최대"
            className="w-24 rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  )
}
