"use client"

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from "recharts"
import type { InvestorFlowEntry } from "@/lib/api/naver-investor-types"

interface SupplyDemandBarProps {
  readonly entries: readonly InvestorFlowEntry[]
  readonly days?: number
}

export function SupplyDemandBar({ entries, days = 5 }: SupplyDemandBarProps) {
  const data = entries.slice(0, days).reverse().map((e) => ({
    date: e.date.slice(5),
    외국인: e.foreignNet,
    기관: e.institutionNet,
    개인: -(e.foreignNet + e.institutionNet),
  }))

  if (data.length === 0) {
    return <p className="py-4 text-center text-xs text-[var(--color-text-muted)]">수급 데이터 없음</p>
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ left: 0, right: 5, top: 5, bottom: 5 }}>
        <XAxis dataKey="date" fontSize={10} />
        <YAxis fontSize={10} tickFormatter={(v: number) => {
          if (Math.abs(v) >= 1e8) return `${(v / 1e8).toFixed(0)}억`
          if (Math.abs(v) >= 1e4) return `${(v / 1e4).toFixed(0)}만`
          return String(v)
        }} />
        <Tooltip
          formatter={(v: number, name: string) => [v.toLocaleString("ko-KR") + "주", name]}
          contentStyle={{ fontSize: 11, borderRadius: 8 }}
        />
        <Legend wrapperStyle={{ fontSize: 10 }} />
        <ReferenceLine y={0} stroke="var(--color-border-default)" />
        <Bar dataKey="외국인" fill="#ef4444" radius={[2, 2, 0, 0]} barSize={16} />
        <Bar dataKey="기관" fill="#3b82f6" radius={[2, 2, 0, 0]} barSize={16} />
        <Bar dataKey="개인" fill="#a3a3a3" radius={[2, 2, 0, 0]} barSize={16} />
      </BarChart>
    </ResponsiveContainer>
  )
}
