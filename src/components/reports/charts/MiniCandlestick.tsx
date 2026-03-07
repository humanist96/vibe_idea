"use client"

import type { HistoricalData } from "@/lib/api/naver-finance"

interface MiniCandlestickProps {
  readonly data: readonly HistoricalData[]
}

export function MiniCandlestick({ data }: MiniCandlestickProps) {
  if (data.length === 0) {
    return <p className="py-4 text-center text-xs text-[var(--color-text-muted)]">차트 데이터 없음</p>
  }

  const allPrices = data.flatMap((d) => [d.high, d.low])
  const minPrice = Math.min(...allPrices)
  const maxPrice = Math.max(...allPrices)
  const priceRange = maxPrice - minPrice || 1

  const maxVolume = Math.max(...data.map((d) => d.volume), 1)

  const chartHeight = 120
  const volumeHeight = 30
  const totalHeight = chartHeight + volumeHeight + 10
  const candleWidth = Math.min(20, Math.max(8, (280 / data.length) - 4))
  const totalWidth = data.length * (candleWidth + 4) + 10
  const svgWidth = Math.max(totalWidth, 280)

  const scaleY = (price: number) =>
    chartHeight - ((price - minPrice) / priceRange) * (chartHeight - 10) + 5

  return (
    <div className="overflow-x-auto">
      <svg width={svgWidth} height={totalHeight} className="mx-auto">
        {data.map((d, i) => {
          const x = i * (candleWidth + 4) + 10
          const isUp = d.close >= d.open
          const fill = isUp ? "var(--color-gain)" : "var(--color-loss)"
          const bodyTop = scaleY(Math.max(d.open, d.close))
          const bodyBottom = scaleY(Math.min(d.open, d.close))
          const bodyHeight = Math.max(bodyBottom - bodyTop, 1)

          const volH = (d.volume / maxVolume) * volumeHeight

          return (
            <g key={i}>
              {/* Wick */}
              <line
                x1={x + candleWidth / 2}
                y1={scaleY(d.high)}
                x2={x + candleWidth / 2}
                y2={scaleY(d.low)}
                stroke={fill}
                strokeWidth={1}
              />
              {/* Body */}
              <rect
                x={x}
                y={bodyTop}
                width={candleWidth}
                height={bodyHeight}
                fill={fill}
                rx={1}
              />
              {/* Volume */}
              <rect
                x={x}
                y={chartHeight + 10 + volumeHeight - volH}
                width={candleWidth}
                height={volH}
                fill={fill}
                opacity={0.3}
                rx={1}
              />
              {/* Date label */}
              <text
                x={x + candleWidth / 2}
                y={totalHeight}
                fontSize={7}
                fill="var(--color-text-muted)"
                textAnchor="middle"
              >
                {d.date.slice(5)}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
