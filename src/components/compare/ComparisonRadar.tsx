"use client"

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts"

interface RadarItem {
  readonly name: string
  readonly color: string
  readonly technical: number
  readonly fundamental: number
  readonly sentiment: number
  readonly risk: number
}

interface ComparisonRadarProps {
  readonly items: readonly RadarItem[]
}

export function ComparisonRadar({ items }: ComparisonRadarProps) {
  const data = [
    { subject: "기술적 분석", ...Object.fromEntries(items.map((it) => [it.name, it.technical])) },
    { subject: "펀더멘탈", ...Object.fromEntries(items.map((it) => [it.name, it.fundamental])) },
    { subject: "시장 심리", ...Object.fromEntries(items.map((it) => [it.name, it.sentiment])) },
    { subject: "리스크", ...Object.fromEntries(items.map((it) => [it.name, it.risk])) },
  ]

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid
            stroke="var(--color-border-subtle)"
            strokeDasharray="3 3"
          />
          <PolarAngleAxis
            dataKey="subject"
            tick={{
              fontSize: 11,
              fill: "var(--color-text-secondary)",
            }}
          />
          <PolarRadiusAxis
            domain={[0, 10]}
            tick={{ fontSize: 9, fill: "var(--color-text-muted)" }}
            axisLine={false}
          />
          {items.map((item) => (
            <Radar
              key={item.name}
              name={item.name}
              dataKey={item.name}
              stroke={item.color}
              fill={item.color}
              fillOpacity={0.15}
              strokeWidth={2}
            />
          ))}
          <Legend
            wrapperStyle={{ fontSize: "11px" }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
