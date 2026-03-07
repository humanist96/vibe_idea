"use client"

interface TargetPriceBarProps {
  readonly currentPrice: number
  readonly targetPrice: number | null
}

export function TargetPriceBar({ currentPrice, targetPrice }: TargetPriceBarProps) {
  if (!targetPrice || targetPrice <= 0) {
    return <p className="py-2 text-xs text-[var(--color-text-muted)]">목표가 정보 없음</p>
  }

  const maxVal = Math.max(currentPrice, targetPrice) * 1.1
  const currentWidth = (currentPrice / maxVal) * 100
  const targetWidth = (targetPrice / maxVal) * 100
  const diff = ((targetPrice - currentPrice) / currentPrice) * 100
  const isUpside = diff >= 0

  return (
    <div className="space-y-2">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="w-12 text-[10px] text-[var(--color-text-muted)]">현재가</span>
          <div className="relative h-5 flex-1 rounded bg-[var(--color-surface-50)]">
            <div
              className="h-full rounded bg-[var(--color-accent-400)]"
              style={{ width: `${currentWidth}%` }}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium tabular-nums text-[var(--color-text-primary)]">
              {currentPrice.toLocaleString("ko-KR")}원
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-12 text-[10px] text-[var(--color-text-muted)]">목표가</span>
          <div className="relative h-5 flex-1 rounded bg-[var(--color-surface-50)]">
            <div
              className="h-full rounded"
              style={{
                width: `${targetWidth}%`,
                backgroundColor: isUpside ? "var(--color-gain)" : "var(--color-loss)",
                opacity: 0.6,
              }}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium tabular-nums text-[var(--color-text-primary)]">
              {targetPrice.toLocaleString("ko-KR")}원
            </span>
          </div>
        </div>
      </div>
      <p className="text-xs font-medium" style={{ color: isUpside ? "var(--color-gain)" : "var(--color-loss)" }}>
        {isUpside ? "+" : ""}{diff.toFixed(1)}% {isUpside ? "상승 여력" : "하락 리스크"}
      </p>
    </div>
  )
}
