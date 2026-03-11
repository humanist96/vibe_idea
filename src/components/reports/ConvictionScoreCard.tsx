"use client"

import { Gauge } from "lucide-react"
import { CONVICTION_SCORE_COLORS } from "./report-constants"
import type { ConvictionScore } from "@/lib/report/types"

interface ConvictionScoreCardProps {
  readonly conviction: ConvictionScore
  readonly stockName: string
}

const SIGNAL_COLORS = {
  bullish: "bg-green-500",
  bearish: "bg-red-500",
  neutral: "bg-yellow-500",
}

const SIGNAL_LABELS = {
  bullish: "강세",
  bearish: "약세",
  neutral: "중립",
}

export function ConvictionScoreCard({ conviction, stockName }: ConvictionScoreCardProps) {
  const color = CONVICTION_SCORE_COLORS[conviction.label] ?? "#6b7280"
  const pct = ((conviction.score - 1) / 9) * 100

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Gauge className="h-3.5 w-3.5 text-indigo-500" />
        <h4 className="text-xs font-bold text-[var(--color-text-primary)]">투자 컨빅션 스코어</h4>
      </div>

      {/* Score Bar */}
      <div className="relative h-6 rounded-full overflow-visible">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 opacity-20" />
        <div
          className="absolute top-1/2 -translate-y-1/2 h-7 w-7 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-[10px] font-bold text-white z-10"
          style={{ backgroundColor: color, left: `clamp(0.5rem, ${pct}%, calc(100% - 1.25rem))` }}
        >
          {conviction.score}
        </div>
      </div>

      {/* Score gauge - simplified */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold text-white"
            style={{ backgroundColor: color }}
          >
            {conviction.score}/10
          </span>
          <span className="text-xs font-semibold" style={{ color }}>
            {conviction.label}
          </span>
        </div>
        <span className="text-[10px] text-[var(--color-text-muted)]">
          기술·수급·센티먼트·컨센서스 종합
        </span>
      </div>

      {/* Factor Breakdown */}
      <div className="space-y-1.5">
        {conviction.factors.map((factor) => (
          <div key={factor.name} className="flex items-center gap-2 text-[11px]">
            <span className={`h-1.5 w-1.5 rounded-full ${SIGNAL_COLORS[factor.signal]}`} />
            <span className="flex-1 text-[var(--color-text-secondary)]">{factor.name}</span>
            <span className="text-[10px] text-[var(--color-text-muted)]">
              {SIGNAL_LABELS[factor.signal]}
            </span>
            <div className="w-16 h-1.5 rounded-full bg-[var(--color-surface-100)]">
              <div
                className={`h-full rounded-full ${SIGNAL_COLORS[factor.signal]}`}
                style={{ width: `${factor.weight}%` }}
              />
            </div>
            <span className="w-7 text-right tabular-nums text-[10px] text-[var(--color-text-muted)]">
              {factor.weight}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
