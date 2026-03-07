"use client"

import { Eye } from "lucide-react"

interface USWatchPointsProps {
  readonly points: readonly string[]
}

export function USWatchPoints({ points }: USWatchPointsProps) {
  if (points.length === 0) return null

  return (
    <div className="animate-fade-up space-y-3">
      <div className="flex items-center gap-2">
        <Eye className="h-3.5 w-3.5 text-[var(--color-accent-500)]" />
        <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
          주요 관찰 포인트
        </h3>
      </div>
      <div className="space-y-2">
        {points.map((point, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-lg bg-amber-50/50 p-3"
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-700">
              {i + 1}
            </span>
            <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
              {point}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
