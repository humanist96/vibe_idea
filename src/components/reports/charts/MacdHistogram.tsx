"use client"

import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer, ReferenceLine } from "recharts"
import type { HistoricalData } from "@/lib/api/naver-finance"

interface MacdHistogramProps {
  readonly historical: readonly HistoricalData[]
}

function calculateEMA(data: readonly number[], period: number): number[] {
  const ema: number[] = []
  const k = 2 / (period + 1)
  ema[0] = data[0]
  for (let i = 1; i < data.length; i++) {
    ema[i] = data[i] * k + ema[i - 1] * (1 - k)
  }
  return ema
}

export function MacdHistogram({ historical }: MacdHistogramProps) {
  if (historical.length < 5) {
    return <p className="py-4 text-center text-xs text-[var(--color-text-muted)]">데이터 부족</p>
  }

  const closes = historical.map((h) => h.close)
  const ema12 = calculateEMA(closes, 12)
  const ema26 = calculateEMA(closes, 26)
  const macdLine = ema12.map((v, i) => v - ema26[i])
  const signal = calculateEMA(macdLine, 9)
  const histogram = macdLine.map((v, i) => v - signal[i])

  const data = historical.slice(-10).map((h, i) => {
    const idx = historical.length - 10 + i
    return {
      date: h.date.slice(5),
      value: Math.round(histogram[idx] ?? 0),
    }
  })

  return (
    <ResponsiveContainer width="100%" height={120}>
      <BarChart data={data} margin={{ left: 0, right: 5, top: 5, bottom: 5 }}>
        <XAxis dataKey="date" fontSize={9} />
        <YAxis fontSize={9} />
        <Tooltip
          formatter={(v: number) => [v.toLocaleString("ko-KR"), "MACD"]}
          contentStyle={{ fontSize: 11, borderRadius: 8 }}
        />
        <ReferenceLine y={0} stroke="var(--color-border-default)" />
        <Bar dataKey="value" radius={[2, 2, 0, 0]} barSize={14}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.value >= 0 ? "var(--color-gain)" : "var(--color-loss)"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
