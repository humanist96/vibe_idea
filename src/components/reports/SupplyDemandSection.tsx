"use client"

import { Users } from "lucide-react"
import { SupplyDemandBar } from "./charts/SupplyDemandBar"
import type { InvestorFlow } from "@/lib/api/naver-investor-types"

interface SupplyDemandSectionProps {
  readonly investorFlow: InvestorFlow | null
}

export function SupplyDemandSection({ investorFlow }: SupplyDemandSectionProps) {
  const entries = investorFlow?.entries ?? []

  if (entries.length === 0) {
    return (
      <div className="py-4 text-center text-xs text-[var(--color-text-muted)]">
        수급 데이터를 불러올 수 없습니다.
      </div>
    )
  }

  const yesterday = entries[0]
  const fiveDay = entries.slice(0, 5)
  const twentyDay = entries.slice(0, 20)

  const sum = (arr: typeof entries, key: "foreignNet" | "institutionNet") =>
    arr.reduce((s, e) => s + e[key], 0)

  const foreignFive = sum(fiveDay, "foreignNet")
  const foreignTwenty = sum(twentyDay, "foreignNet")
  const instFive = sum(fiveDay, "institutionNet")
  const instTwenty = sum(twentyDay, "institutionNet")
  const indivFive = -(foreignFive + instFive)
  const indivTwenty = -(foreignTwenty + instTwenty)

  const fmt = (v: number) => {
    if (Math.abs(v) >= 1e8) return `${(v / 1e8).toFixed(1)}억`
    if (Math.abs(v) >= 1e4) return `${(v / 1e4).toFixed(0)}만`
    return v.toLocaleString("ko-KR")
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Users className="h-3.5 w-3.5 text-blue-500" />
        <h4 className="text-xs font-bold text-[var(--color-text-primary)]">수급 분석</h4>
      </div>

      <SupplyDemandBar entries={entries} days={5} />

      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[var(--color-border-subtle)]">
            <th className="pb-1.5 text-left font-semibold text-[var(--color-text-tertiary)]">투자자</th>
            <th className="pb-1.5 text-right font-semibold text-[var(--color-text-tertiary)]">어제</th>
            <th className="pb-1.5 text-right font-semibold text-[var(--color-text-tertiary)]">5일</th>
            <th className="pb-1.5 text-right font-semibold text-[var(--color-text-tertiary)]">20일</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-[var(--color-border-subtle)]">
            <td className="py-1.5 text-[var(--color-text-secondary)]">외국인</td>
            <td className="py-1.5 text-right tabular-nums font-medium" style={{ color: yesterday.foreignNet >= 0 ? "var(--color-gain)" : "var(--color-loss)" }}>
              {fmt(yesterday.foreignNet)}
            </td>
            <td className="py-1.5 text-right tabular-nums font-medium" style={{ color: foreignFive >= 0 ? "var(--color-gain)" : "var(--color-loss)" }}>
              {fmt(foreignFive)}
            </td>
            <td className="py-1.5 text-right tabular-nums font-medium" style={{ color: foreignTwenty >= 0 ? "var(--color-gain)" : "var(--color-loss)" }}>
              {fmt(foreignTwenty)}
            </td>
          </tr>
          <tr className="border-b border-[var(--color-border-subtle)]">
            <td className="py-1.5 text-[var(--color-text-secondary)]">기관</td>
            <td className="py-1.5 text-right tabular-nums font-medium" style={{ color: yesterday.institutionNet >= 0 ? "var(--color-gain)" : "var(--color-loss)" }}>
              {fmt(yesterday.institutionNet)}
            </td>
            <td className="py-1.5 text-right tabular-nums font-medium" style={{ color: instFive >= 0 ? "var(--color-gain)" : "var(--color-loss)" }}>
              {fmt(instFive)}
            </td>
            <td className="py-1.5 text-right tabular-nums font-medium" style={{ color: instTwenty >= 0 ? "var(--color-gain)" : "var(--color-loss)" }}>
              {fmt(instTwenty)}
            </td>
          </tr>
          <tr>
            <td className="py-1.5 text-[var(--color-text-secondary)]">개인</td>
            <td className="py-1.5 text-right tabular-nums font-medium text-[var(--color-text-muted)]">
              {fmt(-(yesterday.foreignNet + yesterday.institutionNet))}
            </td>
            <td className="py-1.5 text-right tabular-nums font-medium text-[var(--color-text-muted)]">
              {fmt(indivFive)}
            </td>
            <td className="py-1.5 text-right tabular-nums font-medium text-[var(--color-text-muted)]">
              {fmt(indivTwenty)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
