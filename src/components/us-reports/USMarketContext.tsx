"use client"

import { TrendingUp, TrendingDown, Globe } from "lucide-react"
import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import type { USMarketContextData } from "@/lib/report/us-types"

interface USMarketContextProps {
  readonly market: USMarketContextData
}

export function USMarketContext({ market }: USMarketContextProps) {
  const { indices, fearGreed, sectors, macro } = market
  const sortedSectors = [...sectors].sort(
    (a, b) => b.changePercent - a.changePercent
  )

  return (
    <Card className="animate-fade-up">
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <Globe className="h-3.5 w-3.5 text-[var(--color-accent-500)]" />
            시장 컨텍스트
          </span>
        </CardTitle>
      </CardHeader>

      {/* Index Cards */}
      <div className="grid grid-cols-2 gap-3 px-4 sm:grid-cols-5">
        {indices.map((idx) => (
          <div
            key={idx.symbol}
            className="rounded-lg bg-[var(--color-surface-50)] p-3"
          >
            <p className="text-[10px] font-medium text-[var(--color-text-muted)]">
              {idx.name}
            </p>
            <p className="mt-0.5 text-base font-bold tabular-nums text-[var(--color-text-primary)]">
              {idx.price.toLocaleString("en-US", { maximumFractionDigits: 2 })}
            </p>
            <p
              className="mt-0.5 flex items-center gap-0.5 text-xs font-medium tabular-nums"
              style={{
                color:
                  idx.changePercent >= 0
                    ? "var(--color-gain)"
                    : "var(--color-loss)",
              }}
            >
              {idx.changePercent >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {idx.changePercent >= 0 ? "+" : ""}
              {idx.changePercent.toFixed(2)}%
            </p>
          </div>
        ))}

        {fearGreed && (
          <div className="rounded-lg bg-[var(--color-surface-50)] p-3">
            <p className="text-[10px] font-medium text-[var(--color-text-muted)]">
              공포-탐욕
            </p>
            <p className="mt-0.5 text-base font-bold tabular-nums text-[var(--color-text-primary)]">
              {fearGreed.score}
            </p>
            <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
              {fearGreed.label}
            </p>
          </div>
        )}
      </div>

      {/* Sector Heatmap */}
      {sortedSectors.length > 0 && (
        <div className="px-4 pt-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            섹터 등락률
          </p>
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-6">
            {sortedSectors.map((s) => {
              const intensity = Math.min(
                Math.abs(s.changePercent) * 30,
                100
              )
              const bg =
                s.changePercent >= 0
                  ? `rgba(16, 185, 129, ${intensity / 100})`
                  : `rgba(239, 68, 68, ${intensity / 100})`
              return (
                <div
                  key={s.etf}
                  className="rounded-lg p-2 text-center"
                  style={{ backgroundColor: bg }}
                >
                  <p className="text-[10px] font-medium text-[var(--color-text-primary)]">
                    {s.sectorKr}
                  </p>
                  <p
                    className="text-xs font-bold tabular-nums"
                    style={{
                      color:
                        s.changePercent >= 0
                          ? "var(--color-gain)"
                          : "var(--color-loss)",
                    }}
                  >
                    {s.changePercent >= 0 ? "+" : ""}
                    {s.changePercent.toFixed(2)}%
                  </p>
                  <p className="text-[9px] text-[var(--color-text-muted)]">
                    {s.etf}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Global Macro Table */}
      {macro.length > 0 && (
        <div className="overflow-x-auto px-4 py-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            글로벌 매크로
          </p>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--color-border-subtle)]">
                <th className="pb-1.5 text-left font-semibold text-[var(--color-text-tertiary)]">
                  지표
                </th>
                <th className="pb-1.5 text-right font-semibold text-[var(--color-text-tertiary)]">
                  현재
                </th>
                <th className="pb-1.5 text-right font-semibold text-[var(--color-text-tertiary)]">
                  변동
                </th>
              </tr>
            </thead>
            <tbody>
              {macro.slice(0, 6).map((m) => (
                <tr
                  key={m.name}
                  className="border-b border-[var(--color-border-subtle)] last:border-0"
                >
                  <td className="py-1.5 text-[var(--color-text-secondary)]">
                    {m.nameKr}
                  </td>
                  <td className="py-1.5 text-right tabular-nums font-medium text-[var(--color-text-primary)]">
                    {m.value.toLocaleString("en-US", {
                      maximumFractionDigits: 2,
                    })}
                    {m.unit}
                  </td>
                  <td
                    className="py-1.5 text-right tabular-nums font-medium"
                    style={{
                      color:
                        m.changePercent >= 0
                          ? "var(--color-gain)"
                          : "var(--color-loss)",
                    }}
                  >
                    {m.changePercent >= 0 ? "+" : ""}
                    {m.changePercent.toFixed(2)}%
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
