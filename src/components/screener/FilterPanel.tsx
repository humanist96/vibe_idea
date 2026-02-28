"use client"

import { Button } from "@/components/ui/Button"

export interface Filters {
  readonly market: "ALL" | "KOSPI" | "KOSDAQ"
  readonly sector: string
  readonly minPrice: string
  readonly maxPrice: string
  readonly minPer: string
  readonly maxPer: string
}

interface FilterPanelProps {
  readonly filters: Filters
  readonly onFilterChange: (filters: Filters) => void
  readonly sectors?: readonly string[]
}

export function FilterPanel({ filters, onFilterChange, sectors = [] }: FilterPanelProps) {
  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    onFilterChange({ ...filters, [key]: value })
  }

  const labelClass = "mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]"
  const inputClass =
    "rounded-lg px-3 py-1.5 text-sm outline-none transition-all duration-200 " +
    "bg-[var(--color-glass-2)] text-[var(--color-text-primary)] " +
    "ring-1 ring-[var(--color-border-subtle)] " +
    "placeholder:text-[var(--color-text-muted)] " +
    "focus:ring-[var(--color-accent-400)]/40"

  return (
    <div className="flex flex-wrap items-end gap-5">
      <div>
        <label className={labelClass}>시장</label>
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
        <label className={labelClass}>섹터</label>
        <select
          value={filters.sector}
          onChange={(e) => updateFilter("sector", e.target.value)}
          className={inputClass}
        >
          <option value="">전체</option>
          {sectors.map((sector) => (
            <option key={sector} value={sector}>
              {sector}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>가격 범위</label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={filters.minPrice}
            onChange={(e) => updateFilter("minPrice", e.target.value)}
            placeholder="최소"
            className={`w-24 ${inputClass}`}
          />
          <span className="text-[var(--color-text-muted)]">~</span>
          <input
            type="text"
            value={filters.maxPrice}
            onChange={(e) => updateFilter("maxPrice", e.target.value)}
            placeholder="최대"
            className={`w-24 ${inputClass}`}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>PER 범위</label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={filters.minPer}
            onChange={(e) => updateFilter("minPer", e.target.value)}
            placeholder="최소"
            className={`w-20 ${inputClass}`}
          />
          <span className="text-[var(--color-text-muted)]">~</span>
          <input
            type="text"
            value={filters.maxPer}
            onChange={(e) => updateFilter("maxPer", e.target.value)}
            placeholder="최대"
            className={`w-20 ${inputClass}`}
          />
        </div>
      </div>
    </div>
  )
}
