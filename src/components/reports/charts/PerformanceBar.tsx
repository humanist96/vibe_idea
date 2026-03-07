"use client"

import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer, ReferenceLine } from "recharts"

interface PerformanceBarProps {
  readonly items: readonly {
    readonly name: string
    readonly changePercent: number
  }[]
}

export function PerformanceBar({ items }: PerformanceBarProps) {
  const data = items.map((item) => ({
    name: item.name.length > 6 ? item.name.slice(0, 6) + "..." : item.name,
    value: Number(item.changePercent.toFixed(2)),
  }))

  return (
    <ResponsiveContainer width="100%" height={Math.max(items.length * 40, 120)}>
      <BarChart data={data} layout="vertical" margin={{ left: 60, right: 40, top: 5, bottom: 5 }}>
        <XAxis type="number" tickFormatter={(v: number) => `${v}%`} fontSize={11} />
        <YAxis type="category" dataKey="name" fontSize={11} width={55} />
        <Tooltip
          formatter={(v: number) => [`${v >= 0 ? "+" : ""}${v}%`, "등락률"]}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <ReferenceLine x={0} stroke="var(--color-border-default)" />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.value >= 0 ? "var(--color-gain)" : "var(--color-loss)"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
