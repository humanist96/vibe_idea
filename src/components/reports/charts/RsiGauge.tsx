"use client"

interface RsiGaugeProps {
  readonly value: number
}

export function RsiGauge({ value }: RsiGaugeProps) {
  const clampedValue = Math.max(0, Math.min(100, value))
  const angle = -90 + (clampedValue / 100) * 180
  const r = 60
  const cx = 80
  const cy = 70

  const needleX = cx + r * 0.7 * Math.cos((angle * Math.PI) / 180)
  const needleY = cy + r * 0.7 * Math.sin((angle * Math.PI) / 180)

  const label = clampedValue >= 70 ? "과매수" : clampedValue <= 30 ? "과매도" : "중립"
  const color = clampedValue >= 70 ? "var(--color-gain)" : clampedValue <= 30 ? "var(--color-loss)" : "var(--color-accent-500)"

  return (
    <div className="flex flex-col items-center">
      <svg width={160} height={90} viewBox="0 0 160 90">
        {/* Background arc */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="var(--color-border-subtle)"
          strokeWidth={12}
          strokeLinecap="round"
        />
        {/* Colored zones */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx - r * Math.cos(Math.PI * 0.667)} ${cy - r * Math.sin(Math.PI * 0.667)}`}
          fill="none"
          stroke="var(--color-loss)"
          strokeWidth={12}
          strokeLinecap="round"
          opacity={0.3}
        />
        <path
          d={`M ${cx + r * Math.cos(Math.PI * 0.333)} ${cy - r * Math.sin(Math.PI * 0.333)} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="var(--color-gain)"
          strokeWidth={12}
          strokeLinecap="round"
          opacity={0.3}
        />
        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needleX}
          y2={needleY}
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r={4} fill={color} />
        {/* Labels */}
        <text x={cx - r - 2} y={cy + 14} fontSize={8} fill="var(--color-text-muted)" textAnchor="middle">0</text>
        <text x={cx} y={cy - r + 6} fontSize={8} fill="var(--color-text-muted)" textAnchor="middle">50</text>
        <text x={cx + r + 2} y={cy + 14} fontSize={8} fill="var(--color-text-muted)" textAnchor="middle">100</text>
      </svg>
      <div className="mt-1 text-center">
        <span className="text-lg font-bold tabular-nums" style={{ color }}>{clampedValue.toFixed(1)}</span>
        <span className="ml-1 text-xs text-[var(--color-text-muted)]">{label}</span>
      </div>
    </div>
  )
}
