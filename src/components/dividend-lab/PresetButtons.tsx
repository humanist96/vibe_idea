"use client"

import { TrendingUp, Shield, Crown, CalendarDays, Scale, Flame } from "lucide-react"
import type { DividendScreenerPreset, DividendMarket } from "@/lib/dividend/dividend-types"

const PRESETS: readonly {
  readonly id: DividendScreenerPreset
  readonly label: string
  readonly description: string
  readonly icon: React.ComponentType<{ className?: string }>
}[] = [
  { id: "high-yield", label: "고배당", description: "배당률 4%+", icon: Flame },
  { id: "growth", label: "배당 성장", description: "3년 연속 증가", icon: TrendingUp },
  { id: "safety", label: "안전 배당", description: "배당성향 60% 이하", icon: Shield },
  { id: "aristocrat", label: "배당 귀족", description: "10년+ 연속 증가", icon: Crown },
  { id: "monthly", label: "월배당", description: "분기/월 배당", icon: CalendarDays },
  { id: "value", label: "밸류+배당", description: "저평가 배당주", icon: Scale },
]

const MARKETS: readonly { readonly id: DividendMarket | "ALL"; readonly label: string }[] = [
  { id: "ALL", label: "통합" },
  { id: "KR", label: "국내" },
  { id: "US", label: "해외" },
]

interface PresetButtonsProps {
  readonly activePreset: DividendScreenerPreset | null
  readonly market: DividendMarket | "ALL"
  readonly onPresetChange: (preset: DividendScreenerPreset | null) => void
  readonly onMarketChange: (market: DividendMarket | "ALL") => void
}

export function PresetButtons({
  activePreset,
  market,
  onPresetChange,
  onMarketChange,
}: PresetButtonsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex gap-1 rounded-lg bg-[var(--color-glass-1)] p-1">
          {MARKETS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onMarketChange(m.id)}
              className={
                "rounded-md px-3 py-1.5 text-xs font-medium transition-all " +
                (market === m.id
                  ? "bg-[var(--color-glass-3)] text-[var(--color-text-primary)] shadow-sm"
                  : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]")
              }
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => {
          const Icon = preset.icon
          const isActive = activePreset === preset.id
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onPresetChange(isActive ? null : preset.id)}
              className={
                "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all " +
                "ring-1 " +
                (isActive
                  ? "bg-blue-500/10 text-blue-400 ring-blue-500/30"
                  : "bg-[var(--color-glass-1)] text-[var(--color-text-tertiary)] ring-[var(--color-border-subtle)] hover:bg-[var(--color-glass-2)] hover:text-[var(--color-text-secondary)]")
              }
            >
              <Icon className="h-3.5 w-3.5" />
              {preset.label}
              <span className="hidden sm:inline text-[10px] opacity-60">
                {preset.description}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
