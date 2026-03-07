"use client"

import { TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import type { MarketContextData } from "@/lib/report/types"

interface MarketContextProps {
  readonly market: MarketContextData
}

export function MarketContext({ market }: MarketContextProps) {
  const { indices, fearGreed, macroKr } = market

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-[var(--color-accent-500)]" />
            시장 컨텍스트
          </span>
        </CardTitle>
      </CardHeader>

      {/* Index Cards */}
      <div className="grid grid-cols-2 gap-3 p-4 pt-0 sm:grid-cols-3 lg:grid-cols-4">
        {indices.map((idx) => (
          <div key={idx.name} className="rounded-lg bg-[var(--color-surface-50)] p-3">
            <p className="text-[10px] font-medium text-[var(--color-text-muted)]">{idx.name}</p>
            <p className="mt-0.5 text-base font-bold tabular-nums text-[var(--color-text-primary)]">
              {idx.value.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}
            </p>
            <p
              className="mt-0.5 flex items-center gap-0.5 text-xs font-medium tabular-nums"
              style={{ color: idx.change >= 0 ? "var(--color-gain)" : "var(--color-loss)" }}
            >
              {idx.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {idx.change >= 0 ? "+" : ""}{idx.changePercent.toFixed(2)}%
            </p>
          </div>
        ))}

        {fearGreed && (
          <div className="rounded-lg bg-[var(--color-surface-50)] p-3">
            <p className="text-[10px] font-medium text-[var(--color-text-muted)]">공포-탐욕</p>
            <p className="mt-0.5 text-base font-bold tabular-nums text-[var(--color-text-primary)]">
              {fearGreed.score}
            </p>
            <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">{fearGreed.label}</p>
          </div>
        )}
      </div>

      {/* Macro Changes Table */}
      {macroKr.length > 0 && (
        <div className="overflow-x-auto px-4 pb-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--color-border-subtle)]">
                <th className="pb-1.5 text-left font-semibold text-[var(--color-text-tertiary)]">매크로 지표</th>
                <th className="pb-1.5 text-right font-semibold text-[var(--color-text-tertiary)]">현재</th>
                <th className="pb-1.5 text-right font-semibold text-[var(--color-text-tertiary)]">변동</th>
              </tr>
            </thead>
            <tbody>
              {macroKr.slice(0, 5).map((m) => (
                <tr key={m.name} className="border-b border-[var(--color-border-subtle)] last:border-0">
                  <td className="py-1.5 text-[var(--color-text-secondary)]">{m.name}</td>
                  <td className="py-1.5 text-right tabular-nums font-medium text-[var(--color-text-primary)]">
                    {m.value.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}{m.unit}
                  </td>
                  <td
                    className="py-1.5 text-right tabular-nums font-medium"
                    style={{ color: m.change >= 0 ? "var(--color-gain)" : "var(--color-loss)" }}
                  >
                    {m.change >= 0 ? "+" : ""}{m.changePercent.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
