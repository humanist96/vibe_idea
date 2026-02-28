"use client"

interface ScoreGaugeProps {
  readonly score: number
  readonly size?: number
}

function getGaugeColor(score: number): string {
  if (score >= 7) return "#16a34a"
  if (score >= 4) return "#d97706"
  return "#dc2626"
}

export function ScoreGauge({ score, size = 120 }: ScoreGaugeProps) {
  const radius = (size - 16) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (score / 10) * circumference
  const color = getGaugeColor(score)

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth="8"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold tabular-nums" style={{ color }}>
          {score != null ? score.toFixed(1) : "--"}
        </span>
        <span className="text-xs text-[var(--color-text-muted)]">/ 10</span>
      </div>
    </div>
  )
}
