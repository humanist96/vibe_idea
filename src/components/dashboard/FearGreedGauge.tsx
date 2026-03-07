"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils/cn"

interface FearGreedData {
  readonly score: number
  readonly label: string
  readonly description: string
  readonly updatedAt: string
}

function getScoreColor(score: number): string {
  if (score <= 20) return "var(--color-loss)"
  if (score <= 40) return "#6366f1"
  if (score <= 60) return "var(--color-text-tertiary)"
  if (score <= 80) return "#f59e0b"
  return "var(--color-gain)"
}

function getGradientId(score: number): string {
  if (score <= 25) return "fear-extreme"
  if (score <= 50) return "fear"
  if (score <= 75) return "greed"
  return "greed-extreme"
}

export function FearGreedGauge() {
  const [data, setData] = useState<FearGreedData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/fear-greed")
        const json = await res.json()
        if (json.success) setData(json.data)
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="glass-card p-5 animate-fade-up">
        <div className="skeleton-shimmer h-40 rounded-lg" />
      </div>
    )
  }

  if (!data) return null

  const angle = -90 + (data.score / 100) * 180
  const color = getScoreColor(data.score)
  const gradId = getGradientId(data.score)

  return (
    <div className="glass-card p-5 animate-fade-up">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-secondary)]">
          공포-탐욕 지수
        </h3>
        <span className="text-[10px] text-[var(--color-text-tertiary)]">
          {new Date(data.updatedAt).toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          기준
        </span>
      </div>

      <div className="flex flex-col items-center">
        {/* Gauge SVG */}
        <svg viewBox="0 0 200 120" className="w-full max-w-[200px]">
          <defs>
            <linearGradient id={`fg-${gradId}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="25%" stopColor="#6366f1" />
              <stop offset="50%" stopColor="#94a3b8" />
              <stop offset="75%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#dc2626" />
            </linearGradient>
          </defs>

          {/* Background arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="var(--color-surface-200)"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Colored arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke={`url(#fg-${gradId})`}
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Needle */}
          <g transform={`rotate(${angle}, 100, 100)`}>
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="35"
              stroke={color}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="100" cy="100" r="5" fill={color} />
          </g>

          {/* Labels */}
          <text x="20" y="115" fontSize="8" fill="var(--color-text-tertiary)" textAnchor="middle">
            공포
          </text>
          <text x="180" y="115" fontSize="8" fill="var(--color-text-tertiary)" textAnchor="middle">
            탐욕
          </text>
        </svg>

        {/* Score */}
        <div className="mt-2 text-center">
          <span className="tabular-nums text-3xl font-bold" style={{ color }}>
            {data.score}
          </span>
          <span
            className={cn(
              "ml-2 rounded-full px-2.5 py-0.5 text-xs font-semibold",
              data.score <= 40
                ? "bg-[var(--color-loss-soft)] text-[var(--color-loss)]"
                : data.score <= 60
                  ? "bg-[var(--color-surface-100)] text-[var(--color-text-secondary)]"
                  : "bg-[var(--color-gain-soft)] text-[var(--color-gain)]"
            )}
          >
            {data.label}
          </span>
        </div>

        <p className="mt-2 text-center text-xs text-[var(--color-text-tertiary)]">
          {data.description}
        </p>
      </div>
    </div>
  )
}
