"use client"

interface FiftyTwoWeekProgressProps {
  readonly current: number
  readonly high: number
  readonly low: number
}

export function FiftyTwoWeekProgress({ current, high, low }: FiftyTwoWeekProgressProps) {
  const range = high - low
  const position = range > 0 ? ((current - low) / range) * 100 : 50

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[10px] text-[var(--color-text-muted)]">
        <span>{low.toLocaleString("ko-KR")}원</span>
        <span>{high.toLocaleString("ko-KR")}원</span>
      </div>
      <div className="relative h-2 rounded-full bg-[var(--color-surface-100)]">
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-blue-400 via-amber-400 to-red-400"
          style={{ width: "100%" }}
        />
        <div
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[var(--color-accent-500)] shadow-sm"
          style={{ left: `${Math.max(2, Math.min(98, position))}%` }}
        />
      </div>
      <div className="text-center">
        <span className="text-xs font-medium text-[var(--color-text-primary)]">
          현재 {current.toLocaleString("ko-KR")}원
        </span>
        <span className="ml-1 text-[10px] text-[var(--color-text-muted)]">
          ({position.toFixed(0)}% 위치)
        </span>
      </div>
    </div>
  )
}
