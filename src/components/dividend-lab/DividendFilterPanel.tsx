"use client"

import { useState } from "react"
import { SlidersHorizontal, RotateCcw } from "lucide-react"
import type { DividendScreenerFilters, DividendFrequency } from "@/lib/dividend/dividend-types"

type FilterState = {
  readonly yieldMin: number
  readonly yieldMax: number
  readonly payoutRatioMax: number | null
  readonly consecutiveYearsMin: number
  readonly growthRateMin: number | null
  readonly debtToEquityMax: number | null
  readonly fcfCoverageMin: number | null
  readonly frequency: readonly DividendFrequency[]
}

const DEFAULT_FILTERS: FilterState = {
  yieldMin: 0,
  yieldMax: 15,
  payoutRatioMax: null,
  consecutiveYearsMin: 0,
  growthRateMin: null,
  debtToEquityMax: null,
  fcfCoverageMin: null,
  frequency: [],
}

const CONSECUTIVE_OPTIONS = [0, 3, 5, 10, 15, 20, 25]

const FREQUENCY_OPTIONS: readonly { readonly value: DividendFrequency; readonly label: string }[] = [
  { value: "annual", label: "연간" },
  { value: "semi", label: "반기" },
  { value: "quarterly", label: "분기" },
  { value: "monthly", label: "월" },
]

interface DividendFilterPanelProps {
  readonly onFilterChange: (filters: Partial<DividendScreenerFilters>) => void
}

export function DividendFilterPanel({ onFilterChange }: DividendFilterPanelProps) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [isOpen, setIsOpen] = useState(false)

  function updateFilter<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    const updated = { ...filters, [key]: value }
    setFilters(updated)
    emitFilters(updated)
  }

  function emitFilters(f: FilterState) {
    const partial: Partial<DividendScreenerFilters> = {
      ...(f.yieldMin > 0 ? { yieldMin: f.yieldMin } : {}),
      ...(f.yieldMax < 15 ? { yieldMax: f.yieldMax } : {}),
      ...(f.payoutRatioMax !== null ? { payoutRatioMax: f.payoutRatioMax } : {}),
      ...(f.consecutiveYearsMin > 0 ? { consecutiveYearsMin: f.consecutiveYearsMin } : {}),
      ...(f.growthRateMin !== null ? { growthRateMin: f.growthRateMin } : {}),
      ...(f.debtToEquityMax !== null ? { debtToEquityMax: f.debtToEquityMax } : {}),
      ...(f.fcfCoverageMin !== null ? { fcfCoverageMin: f.fcfCoverageMin } : {}),
      ...(f.frequency.length > 0 ? { frequency: f.frequency } : {}),
    }
    onFilterChange(partial)
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS)
    onFilterChange({})
  }

  function toggleFrequency(freq: DividendFrequency) {
    const current = [...filters.frequency]
    const idx = current.indexOf(freq)
    const updated = idx >= 0
      ? [...current.slice(0, idx), ...current.slice(idx + 1)]
      : [...current, freq]
    updateFilter("frequency", updated)
  }

  const hasActiveFilters = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS)

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={
          "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ring-1 transition-all " +
          (hasActiveFilters
            ? "bg-blue-500/10 text-blue-400 ring-blue-500/30"
            : "bg-[var(--color-glass-2)] text-[var(--color-text-tertiary)] ring-[var(--color-border-subtle)] hover:text-[var(--color-text-secondary)]")
        }
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        상세 필터
        {hasActiveFilters && (
          <span className="rounded-full bg-blue-500/20 px-1.5 text-[10px]">ON</span>
        )}
      </button>

      {isOpen && (
        <div className="mt-3 space-y-4 rounded-lg bg-[var(--color-glass-1)] p-4 ring-1 ring-[var(--color-border-subtle)] animate-fade-up">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
              필터 조건
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
              >
                <RotateCcw className="h-3 w-3" />
                초기화
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Yield range */}
            <div>
              <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                배당수익률 (%)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={15}
                  step={0.5}
                  value={filters.yieldMin}
                  onChange={(e) => updateFilter("yieldMin", Number(e.target.value))}
                  className="w-full rounded-md bg-[var(--color-glass-2)] px-2 py-1.5 text-xs tabular-nums text-[var(--color-text-primary)] ring-1 ring-[var(--color-border-subtle)]"
                />
                <span className="text-[10px] text-[var(--color-text-muted)]">~</span>
                <input
                  type="number"
                  min={0}
                  max={15}
                  step={0.5}
                  value={filters.yieldMax}
                  onChange={(e) => updateFilter("yieldMax", Number(e.target.value))}
                  className="w-full rounded-md bg-[var(--color-glass-2)] px-2 py-1.5 text-xs tabular-nums text-[var(--color-text-primary)] ring-1 ring-[var(--color-border-subtle)]"
                />
              </div>
            </div>

            {/* Payout ratio max */}
            <div>
              <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                배당성향 최대 (%)
              </label>
              <input
                type="number"
                min={10}
                max={200}
                step={5}
                value={filters.payoutRatioMax ?? ""}
                placeholder="제한 없음"
                onChange={(e) => {
                  const v = e.target.value ? Number(e.target.value) : null
                  updateFilter("payoutRatioMax", v)
                }}
                className="w-full rounded-md bg-[var(--color-glass-2)] px-2 py-1.5 text-xs tabular-nums text-[var(--color-text-primary)] ring-1 ring-[var(--color-border-subtle)] placeholder:text-[var(--color-text-muted)]"
              />
            </div>

            {/* Consecutive years min */}
            <div>
              <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                연속 배당 증가 (최소)
              </label>
              <select
                value={filters.consecutiveYearsMin}
                onChange={(e) => updateFilter("consecutiveYearsMin", Number(e.target.value))}
                className="w-full rounded-md bg-[var(--color-glass-2)] px-2 py-1.5 text-xs text-[var(--color-text-primary)] ring-1 ring-[var(--color-border-subtle)]"
              >
                {CONSECUTIVE_OPTIONS.map((y) => (
                  <option key={y} value={y}>
                    {y === 0 ? "제한 없음" : `${y}년 이상`}
                  </option>
                ))}
              </select>
            </div>

            {/* Growth rate min */}
            <div>
              <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                배당 성장률 최소 (%)
              </label>
              <input
                type="number"
                min={0}
                max={30}
                step={1}
                value={filters.growthRateMin ?? ""}
                placeholder="제한 없음"
                onChange={(e) => {
                  const v = e.target.value ? Number(e.target.value) : null
                  updateFilter("growthRateMin", v)
                }}
                className="w-full rounded-md bg-[var(--color-glass-2)] px-2 py-1.5 text-xs tabular-nums text-[var(--color-text-primary)] ring-1 ring-[var(--color-border-subtle)] placeholder:text-[var(--color-text-muted)]"
              />
            </div>

            {/* Debt to equity max */}
            <div>
              <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                부채비율 최대 (D/E %)
              </label>
              <input
                type="number"
                min={0}
                max={500}
                step={10}
                value={filters.debtToEquityMax ?? ""}
                placeholder="제한 없음"
                onChange={(e) => {
                  const v = e.target.value ? Number(e.target.value) : null
                  updateFilter("debtToEquityMax", v)
                }}
                className="w-full rounded-md bg-[var(--color-glass-2)] px-2 py-1.5 text-xs tabular-nums text-[var(--color-text-primary)] ring-1 ring-[var(--color-border-subtle)] placeholder:text-[var(--color-text-muted)]"
              />
            </div>

            {/* FCF coverage min */}
            <div>
              <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                FCF 커버리지 (최소 배수)
              </label>
              <input
                type="number"
                min={0}
                max={10}
                step={0.1}
                value={filters.fcfCoverageMin ?? ""}
                placeholder="제한 없음"
                onChange={(e) => {
                  const v = e.target.value ? Number(e.target.value) : null
                  updateFilter("fcfCoverageMin", v)
                }}
                className="w-full rounded-md bg-[var(--color-glass-2)] px-2 py-1.5 text-xs tabular-nums text-[var(--color-text-primary)] ring-1 ring-[var(--color-border-subtle)] placeholder:text-[var(--color-text-muted)]"
              />
            </div>
          </div>

          {/* Frequency */}
          <div>
            <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
              배당 지급 빈도
            </label>
            <div className="flex flex-wrap gap-1.5">
              {FREQUENCY_OPTIONS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => toggleFrequency(f.value)}
                  className={
                    "rounded-md px-3 py-1.5 text-xs font-medium ring-1 transition-all " +
                    (filters.frequency.includes(f.value)
                      ? "bg-blue-500/10 text-blue-400 ring-blue-500/30"
                      : "bg-[var(--color-glass-2)] text-[var(--color-text-tertiary)] ring-[var(--color-border-subtle)] hover:text-[var(--color-text-secondary)]")
                  }
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
