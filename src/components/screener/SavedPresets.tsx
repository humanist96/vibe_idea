"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { useScreenerPresetsStore, type FilterPreset } from "@/store/screener-presets"
import { type Filters, EMPTY_FILTERS } from "./FilterPanel"
import { Save, Trash2 } from "lucide-react"

interface SavedPresetsProps {
  readonly currentFilters: Filters
  readonly onLoad: (filters: Filters) => void
}

function filtersToRecord(filters: Filters): Record<string, string> {
  const record: Record<string, string> = {}
  for (const [key, value] of Object.entries(filters)) {
    if (value) record[key] = value
  }
  return record
}

function recordToFilters(record: Record<string, string>): Filters {
  return {
    ...EMPTY_FILTERS,
    ...record,
    market: (record.market as Filters["market"]) || "ALL",
  }
}

export function SavedPresets({ currentFilters, onLoad }: SavedPresetsProps) {
  const { presets, addPreset, removePreset } = useScreenerPresetsStore()
  const [showInput, setShowInput] = useState(false)
  const [name, setName] = useState("")

  const handleSave = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    addPreset(trimmed, filtersToRecord(currentFilters))
    setName("")
    setShowInput(false)
  }

  const handleLoad = (preset: FilterPreset) => {
    onLoad(recordToFilters(preset.filters))
  }

  const inputClass =
    "rounded-lg px-3 py-1.5 text-sm outline-none transition-all duration-200 " +
    "bg-[var(--color-glass-2)] text-[var(--color-text-primary)] " +
    "ring-1 ring-[var(--color-border-subtle)] " +
    "placeholder:text-[var(--color-text-muted)] " +
    "focus:ring-[var(--color-accent-400)]/40"

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
        내 프리셋
      </span>

      {presets.map((preset) => (
        <div key={preset.id} className="flex items-center gap-0.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleLoad(preset)}
            className="text-xs"
          >
            {preset.name}
          </Button>
          <button
            type="button"
            onClick={() => removePreset(preset.id)}
            className="rounded p-1 text-[var(--color-text-muted)] hover:text-red-400 transition-colors"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      ))}

      {showInput ? (
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            placeholder="프리셋 이름"
            className={`w-28 ${inputClass}`}
            autoFocus
          />
          <Button variant="primary" size="sm" onClick={handleSave}>
            저장
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowInput(false)}>
            취소
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowInput(true)}
          className="text-xs"
        >
          <Save className="mr-1 h-3 w-3" />
          현재 필터 저장
        </Button>
      )}
    </div>
  )
}
