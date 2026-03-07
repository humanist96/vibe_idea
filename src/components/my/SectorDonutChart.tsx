"use client"

import type { PortfolioItem } from "@/store/portfolio"
import type { QuoteResult } from "@/app/api/user/portfolio/quotes/route"

interface Props {
  readonly items: readonly PortfolioItem[]
  readonly quotes: Record<string, QuoteResult>
}

const COLORS = [
  "#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#f97316", "#84cc16", "#6366f1",
]

function computeSectors(items: readonly PortfolioItem[], quotes: Record<string, QuoteResult>) {
  const sectorMap = new Map<string, number>()

  for (const item of items) {
    const price = quotes[item.ticker]?.price ?? item.avgPrice
    const value = item.quantity * price
    const sector = item.sectorKr || "기타"
    sectorMap.set(sector, (sectorMap.get(sector) ?? 0) + value)
  }

  const entries = [...sectorMap.entries()].sort((a, b) => b[1] - a[1])
  const total = entries.reduce((sum, [, v]) => sum + v, 0)

  return { entries, total }
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const clampedEnd = Math.min(endAngle, startAngle + 359.99)
  const start = polarToCartesian(cx, cy, r, clampedEnd)
  const end = polarToCartesian(cx, cy, r, startAngle)
  const largeArc = clampedEnd - startAngle > 180 ? 1 : 0

  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} L ${cx} ${cy} Z`
}

function polarToCartesian(cx: number, cy: number, r: number, degrees: number) {
  const rad = ((degrees - 90) * Math.PI) / 180
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  }
}

export function SectorDonutChart({ items, quotes }: Props) {
  const { entries, total } = computeSectors(items, quotes)

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-card)] p-4 sm:p-6">
        <h3 className="mb-2 text-sm font-bold text-[var(--color-text-primary)]">섹터 비중</h3>
        <p className="text-xs text-[var(--color-text-muted)]">종목 추가 후 확인</p>
      </div>
    )
  }

  let currentAngle = 0

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-card)] p-4 sm:p-6">
      <h3 className="mb-4 text-sm font-bold text-[var(--color-text-primary)]">섹터 비중</h3>

      <div className="flex items-center justify-center">
        <svg viewBox="0 0 200 200" className="h-28 w-28 sm:h-36 sm:w-36">
          {entries.map(([sector, value], idx) => {
            const angle = total > 0 ? (value / total) * 360 : 0
            const path = describeArc(100, 100, 80, currentAngle, currentAngle + angle)
            currentAngle += angle

            return (
              <path
                key={sector}
                d={path}
                fill={COLORS[idx % COLORS.length]}
                stroke="white"
                strokeWidth="2"
              />
            )
          })}
          {/* Center hole */}
          <circle cx="100" cy="100" r="50" fill="var(--color-surface-card)" />
          <text
            x="100"
            y="96"
            textAnchor="middle"
            className="fill-[var(--color-text-primary)] font-bold"
            fontSize="14"
          >
            {entries.length}
          </text>
          <text
            x="100"
            y="114"
            textAnchor="middle"
            className="fill-[var(--color-text-muted)]"
            fontSize="11"
          >
            섹터
          </text>
        </svg>
      </div>

      <div className="mt-4 space-y-2">
        {entries.slice(0, 5).map(([sector, value], idx) => (
          <div key={sector} className="flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: COLORS[idx % COLORS.length] }}
              />
              <span className="truncate text-[var(--color-text-secondary)]">{sector}</span>
            </div>
            <span className="ml-2 shrink-0 text-[var(--color-text-muted)]">
              {total > 0 ? ((value / total) * 100).toFixed(1) : 0}%
            </span>
          </div>
        ))}
        {entries.length > 5 && (
          <div className="text-xs text-[var(--color-text-muted)]">
            +{entries.length - 5}개 더
          </div>
        )}
      </div>
    </div>
  )
}
