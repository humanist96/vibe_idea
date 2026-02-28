"use client"

import { cn } from "@/lib/utils/cn"

interface MiniSparklineProps {
  readonly data: number[]
  readonly width?: number
  readonly height?: number
  readonly color?: string
  readonly className?: string
}

export function MiniSparkline({
  data,
  width = 80,
  height = 32,
  color,
  className,
}: MiniSparklineProps) {
  if (data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const isPositive = data[data.length - 1] >= data[0]
  const strokeColor = color ?? (isPositive ? "#22c55e" : "#ef4444")

  const points = data
    .map((value, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - ((value - min) / range) * (height - 4) - 2
      return `${x},${y}`
    })
    .join(" ")

  return (
    <svg
      width={width}
      height={height}
      className={cn("inline-block", className)}
      viewBox={`0 0 ${width} ${height}`}
    >
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  )
}
