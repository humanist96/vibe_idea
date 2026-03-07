"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import type { NewsSentiment } from "@/lib/api/news-types"

interface SentimentDonutProps {
  readonly sentiment: NewsSentiment
}

const COLORS = ["#22c55e", "#ef4444", "#a3a3a3"]

export function SentimentDonut({ sentiment }: SentimentDonutProps) {
  const data = [
    { name: "긍정", value: sentiment.positiveCount },
    { name: "부정", value: sentiment.negativeCount },
    { name: "중립", value: sentiment.neutralCount },
  ].filter((d) => d.value > 0)

  if (data.length === 0) {
    return <p className="py-4 text-center text-xs text-[var(--color-text-muted)]">뉴스 감성 데이터 없음</p>
  }

  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width={100} height={100}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={28}
            outerRadius={45}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v: number, name: string) => [`${v}건`, name]}
            contentStyle={{ fontSize: 11, borderRadius: 8 }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-1">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-2 text-xs">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
            <span className="text-[var(--color-text-secondary)]">{d.name}</span>
            <span className="font-medium tabular-nums text-[var(--color-text-primary)]">
              {d.value}건 ({((d.value / total) * 100).toFixed(0)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
