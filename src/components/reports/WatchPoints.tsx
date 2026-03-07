"use client"

import { Eye } from "lucide-react"

interface WatchPointsProps {
  readonly points: readonly string[]
}

export function WatchPoints({ points }: WatchPointsProps) {
  if (points.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Eye className="h-3.5 w-3.5 text-amber-500" />
        <h3 className="text-sm font-bold text-[var(--color-text-primary)]">오늘의 주목 포인트</h3>
      </div>

      <div className="space-y-2">
        {points.map((point, i) => (
          <div key={i} className="flex items-start gap-2.5 rounded-lg bg-amber-50/50 p-3">
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[9px] font-bold text-amber-700">
              {i + 1}
            </span>
            <p className="text-xs text-[var(--color-text-primary)]">{point}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
