"use client"

import { Sparkles } from "lucide-react"

interface WeeklyHighlightsProps {
  readonly highlights: readonly string[]
}

export function WeeklyHighlights({ highlights }: WeeklyHighlightsProps) {
  if (highlights.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-secondary)]">
          주간 핵심 이벤트
        </h3>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {highlights.map((highlight, i) => (
          <div
            key={i}
            className="flex items-start gap-2.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-50)] p-3"
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-700">
              {i + 1}
            </span>
            <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
              {highlight}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
