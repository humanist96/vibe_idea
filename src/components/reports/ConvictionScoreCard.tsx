"use client"

import { Gauge } from "lucide-react"
import type { ConvictionScore } from "@/lib/report/types"

interface ConvictionScoreCardProps {
  readonly conviction: ConvictionScore
  readonly stockName: string
}

const SCORE_COLORS: Record<string, string> = {
  "강력 매수": "#16a34a",
  "매수": "#22c55e",
  "중립": "#eab308",
  "매도": "#f97316",
  "강력 매도": "#ef4444",
  "매수 고려": "#22c55e",
  "비중 확대": "#16a34a",
  "관망": "#eab308",
  "비중 축소": "#f97316",
  "매도 고려": "#ef4444",
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
  const color = SCORE_COLORS[conviction.label] ?? "#6b7280"
  const pct = ((conviction.score - 1) / 9) * 100

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Gauge className="h-3.5 w-3.5 text-indigo-500" />
        <h4 className="text-xs font-bold text-[var(--color-text-primary)]">투자 컨빅션 스코어</h4>
      </div>

      {/* Score Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 h-6 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 opacity-20" />
        <div
          className="absolute flex-1 h-6 flex items-center"
          style={{ width: "calc(100% - 3.5rem)" }}
        >
          <div
            className="relative h-6"
            style={{ width: `${pct}%` }}
          >
            <div
              className="absolute right-0 top-1/2 -translate-y-1/2 -translate-x-1/2 h-7 w-7 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-[10px] font-bold text-white"
              style={{ backgroundColor: color }}
            >
              {conviction.score}
            </div>
          </div>
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
