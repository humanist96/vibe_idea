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
      <ReRadarChart data={data} role="img" aria-label="AI 분석 레이더 차트: 기술, 재무, 심리, 리스크">
        <PolarGrid stroke="var(--color-border-subtle, #e2e8f0)" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fontSize: 11, fill: "var(--color-text-muted, #94a3b8)" }}
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
          stroke="var(--color-warning, #d97706)"
          fill="var(--color-warning-light, #f59e0b)"
          fillOpacity={0.15}
          strokeWidth={2}
        />
      </ReRadarChart>
    </ResponsiveContainer>
  )
}
