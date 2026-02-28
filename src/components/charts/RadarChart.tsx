"use client"

import {
  RadarChart as ReRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts"

interface RadarChartProps {
  readonly technical: number
  readonly fundamental: number
  readonly sentiment: number
  readonly risk: number
}

export function RadarChart({
  technical,
  fundamental,
  sentiment,
  risk,
}: RadarChartProps) {
  const data = [
    { subject: "기술", value: technical, fullMark: 10 },
    { subject: "재무", value: fundamental, fullMark: 10 },
    { subject: "심리", value: sentiment, fullMark: 10 },
    { subject: "리스크", value: risk, fullMark: 10 },
  ]

  return (
    <ResponsiveContainer width="100%" height={200}>
      <ReRadarChart data={data}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fontSize: 12, fill: "#6b7280" }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 10]}
          tick={false}
          axisLine={false}
        />
        <Radar
          name="Score"
          dataKey="value"
          stroke="#3b82f6"
          fill="#3b82f6"
          fillOpacity={0.2}
          strokeWidth={2}
        />
      </ReRadarChart>
    </ResponsiveContainer>
  )
}
