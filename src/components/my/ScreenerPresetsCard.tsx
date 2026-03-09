"use client"

import Link from "next/link"
import { useScreenerPresetsStore } from "@/store/screener-presets"
import { Filter } from "lucide-react"

export function ScreenerPresetsCard() {
  const presets = useScreenerPresetsStore((s) => s.presets)

  return (
    <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <Filter className="h-4 w-4 text-purple-500" />
        <h3 className="text-sm font-bold text-[var(--color-text-primary)]">저장된 프리셋</h3>
      </div>

      {presets.length === 0 ? (
        <p className="text-xs text-[var(--color-text-muted)]">
          스크리너에서 프리셋을 저장해보세요.
        </p>
      ) : (
        <div className="space-y-1">
          {presets.map((preset) => {
            const filterCount = Object.keys(preset.filters).length
            const params = new URLSearchParams(preset.filters).toString()

            return (
              <Link
                key={preset.id}
                href={`/screener?${params}`}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-[var(--color-surface-50)] transition-colors"
              >
                <span className="truncate text-sm text-[var(--color-text-primary)]">{preset.name}</span>
                <span className="ml-2 shrink-0 text-xs text-[var(--color-text-muted)]">
                  {filterCount}개 필터
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
