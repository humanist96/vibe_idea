"use client"

import { Button } from "@/components/ui/Button"
import { type Filters, EMPTY_FILTERS } from "./FilterPanel"

interface QuickPresetsProps {
  readonly onApply: (filters: Filters) => void
}

interface PresetConfig {
  readonly label: string
  readonly filters: Partial<Filters>
}

const PRESETS: readonly PresetConfig[] = [
  {
    label: "고배당주",
    filters: { minDividendYield: "3" },
  },
  {
    label: "저PER 가치주",
    filters: { minPer: "1", maxPer: "10" },
  },
  {
    label: "대형주",
    filters: { minMarketCap: "100000" },
  },
  {
    label: "급등주",
    filters: { minChangePercent: "5" },
  },
  {
    label: "외국인선호",
    filters: { minForeignRate: "30" },
  },
]

export function QuickPresets({ onApply }: QuickPresetsProps) {
  const handleClick = (preset: PresetConfig) => {
    onApply({ ...EMPTY_FILTERS, ...preset.filters })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
        퀵 프리셋
      </span>
      {PRESETS.map((preset) => (
        <Button
          key={preset.label}
          variant="ghost"
          size="sm"
          onClick={() => handleClick(preset)}
          className="text-xs"
        >
          {preset.label}
        </Button>
      ))}
    </div>
  )
}
