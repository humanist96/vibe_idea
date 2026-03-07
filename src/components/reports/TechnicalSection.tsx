"use client"

import { Activity } from "lucide-react"
import { RsiGauge } from "./charts/RsiGauge"
import { MacdHistogram } from "./charts/MacdHistogram"
import type { TechnicalIndicators } from "@/lib/analysis/technical"
import type { HistoricalData } from "@/lib/api/naver-finance"
import type { TechnicalSignal, SignalType } from "@/lib/report/types"

interface TechnicalSectionProps {
  readonly technical: TechnicalIndicators | null
  readonly historical: readonly HistoricalData[]
  readonly currentPrice: number
}

function getSignal(condition: boolean | null, trueLabel: SignalType, falseLabel: SignalType): SignalType {
  if (condition === null) return "중립"
  return condition ? trueLabel : falseLabel
}

export function TechnicalSection({ technical, historical, currentPrice }: TechnicalSectionProps) {
  if (!technical) {
    return (
      <div className="py-4 text-center text-xs text-[var(--color-text-muted)]">
        기술적 지표 데이터 부족
      </div>
    )
  }

  const signals: TechnicalSignal[] = [
    {
      name: "RSI(14)",
      value: technical.rsi.toFixed(1),
      signal: technical.rsi > 70 ? "매도" : technical.rsi < 30 ? "매수" : "중립",
    },
    {
      name: "MACD",
      value: technical.macdHistogram.toFixed(0),
      signal: technical.macdHistogram > 0 ? "매수" : technical.macdHistogram < 0 ? "매도" : "중립",
    },
    {
      name: "SMA20 대비",
      value: `${technical.priceVsSma20 >= 0 ? "+" : ""}${technical.priceVsSma20.toFixed(2)}%`,
      signal: getSignal(technical.priceVsSma20 > 0, "매수", "매도"),
    },
    {
      name: "볼린저 위치",
      value: technical.bollingerUpper > 0
        ? `${(((currentPrice - technical.bollingerLower) / (technical.bollingerUpper - technical.bollingerLower)) * 100).toFixed(0)}%`
        : "-",
      signal: currentPrice > technical.bollingerUpper ? "매도" : currentPrice < technical.bollingerLower ? "매수" : "중립",
    },
  ]

  const signalColor = (s: SignalType) =>
    s === "매수" ? "var(--color-gain)" : s === "매도" ? "var(--color-loss)" : "var(--color-accent-500)"

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Activity className="h-3.5 w-3.5 text-green-500" />
        <h4 className="text-xs font-bold text-[var(--color-text-primary)]">기술적 분석</h4>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <RsiGauge value={technical.rsi} />

        <div className="flex-1">
          <MacdHistogram historical={historical} />
        </div>
      </div>

      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[var(--color-border-subtle)]">
            <th className="pb-1.5 text-left font-semibold text-[var(--color-text-tertiary)]">지표</th>
            <th className="pb-1.5 text-right font-semibold text-[var(--color-text-tertiary)]">값</th>
            <th className="pb-1.5 text-right font-semibold text-[var(--color-text-tertiary)]">시그널</th>
          </tr>
        </thead>
        <tbody>
          {signals.map((s) => (
            <tr key={s.name} className="border-b border-[var(--color-border-subtle)] last:border-0">
              <td className="py-1.5 text-[var(--color-text-secondary)]">{s.name}</td>
              <td className="py-1.5 text-right tabular-nums font-medium text-[var(--color-text-primary)]">{s.value}</td>
              <td className="py-1.5 text-right">
                <span
                  className="inline-block rounded px-1.5 py-0.5 text-[10px] font-medium"
                  style={{ color: signalColor(s.signal), backgroundColor: `color-mix(in srgb, ${signalColor(s.signal)} 10%, transparent)` }}
                >
                  {s.signal}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
