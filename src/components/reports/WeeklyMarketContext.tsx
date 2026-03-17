"use client"

import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { TrendingUp, TrendingDown, Activity, BarChart3 } from "lucide-react"
import { formatNumber } from "@/lib/utils/format"
import type { WeeklyMarketData } from "@/lib/report/weekly-types"

interface WeeklyMarketContextProps {
  readonly market: WeeklyMarketData
}

export function WeeklyMarketContext({ market }: WeeklyMarketContextProps) {
  const maxSectorChange = Math.max(
    ...market.sectorPerformance.map((s) => Math.abs(s.changePercent)),
    1
  )

  const sortedSectors = [...market.sectorPerformance].sort(
    (a, b) => b.changePercent - a.changePercent
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-[var(--color-accent-500)]" />
            주간 시장 동향
          </span>
        </CardTitle>
      </CardHeader>

      <div className="space-y-5 px-4 pb-4">
        {/* Weekly Index Changes */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            주요 지수 주간 변동
          </p>
          <div className="space-y-3">
            {market.indices.map((idx) => {
              const isUp = idx.weekChangePercent >= 0
              const range = idx.weekHigh - idx.weekLow
              const currentPos = range > 0 ? ((idx.weekClose - idx.weekLow) / range) * 100 : 50

              return (
                <div key={idx.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[var(--color-text-primary)]">
                      {idx.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold tabular-nums text-[var(--color-text-primary)]">
                        {formatNumber(idx.weekClose)}
                      </span>
                      <span
                        className="inline-flex items-center gap-0.5 text-xs font-medium tabular-nums"
                        style={{ color: isUp ? "var(--color-gain)" : "var(--color-loss)" }}
                      >
                        {isUp ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {isUp ? "+" : ""}
                        {idx.weekChangePercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  {/* Weekly Range Bar */}
                  <div className="relative h-2 rounded-full bg-[var(--color-surface-100)]">
                    <div
                      className="absolute inset-y-0 rounded-full opacity-30"
                      style={{
                        left: "0%",
                        right: "0%",
                        backgroundColor: isUp ? "var(--color-gain)" : "var(--color-loss)",
                      }}
                    />
                    <div
                      className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-white shadow"
                      style={{
                        left: `clamp(0.25rem, ${currentPos}%, calc(100% - 0.5rem))`,
                        backgroundColor: isUp ? "var(--color-gain)" : "var(--color-loss)",
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] tabular-nums text-[var(--color-text-muted)]">
                    <span>저 {formatNumber(idx.weekLow)}</span>
                    <span>고 {formatNumber(idx.weekHigh)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <hr className="border-[var(--color-border-subtle)]" />

        {/* Sector Performance */}
        {sortedSectors.length > 0 && (
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              섹터별 주간 성과
            </p>
            <div className="space-y-1.5">
              {sortedSectors.map((sector) => {
                const isUp = sector.changePercent >= 0
                const barWidth = (Math.abs(sector.changePercent) / maxSectorChange) * 100

                return (
                  <div key={sector.sector} className="flex items-center gap-2 text-[11px]">
                    <span className="w-20 shrink-0 truncate text-[var(--color-text-secondary)]">
                      {sector.sector}
                    </span>
                    <div className="relative flex-1 h-4">
                      <div
                        className="absolute inset-y-0 rounded"
                        style={{
                          width: `${Math.min(barWidth, 100)}%`,
                          backgroundColor: isUp ? "var(--color-gain)" : "var(--color-loss)",
                          opacity: 0.2,
                          left: isUp ? "50%" : undefined,
                          right: isUp ? undefined : "50%",
                        }}
                      />
                    </div>
                    <span
                      className="w-14 shrink-0 text-right tabular-nums font-medium"
                      style={{ color: isUp ? "var(--color-gain)" : "var(--color-loss)" }}
                    >
                      {isUp ? "+" : ""}
                      {sector.changePercent.toFixed(2)}%
                    </span>
                    <span className="w-16 shrink-0 truncate text-right text-[10px] text-[var(--color-text-muted)]">
                      {sector.topStock}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <hr className="border-[var(--color-border-subtle)]" />

        {/* Fear & Greed Change */}
        {market.fearGreedStart != null && market.fearGreedEnd != null && (
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              공포 & 탐욕 지수
            </p>
            <div className="flex items-center gap-3">
              <div className="text-center">
                <p className="text-[10px] text-[var(--color-text-muted)]">주초</p>
                <p className="text-lg font-bold tabular-nums text-[var(--color-text-primary)]">
                  {market.fearGreedStart}
                </p>
              </div>
              <div className="flex items-center">
                {market.fearGreedEnd > market.fearGreedStart ? (
                  <TrendingUp className="h-5 w-5 text-[var(--color-gain)]" />
                ) : market.fearGreedEnd < market.fearGreedStart ? (
                  <TrendingDown className="h-5 w-5 text-[var(--color-loss)]" />
                ) : (
                  <BarChart3 className="h-5 w-5 text-[var(--color-text-muted)]" />
                )}
              </div>
              <div className="text-center">
                <p className="text-[10px] text-[var(--color-text-muted)]">주말</p>
                <p className="text-lg font-bold tabular-nums text-[var(--color-text-primary)]">
                  {market.fearGreedEnd}
                </p>
              </div>
              <div className="ml-2">
                <span
                  className="text-xs font-medium tabular-nums"
                  style={{
                    color: market.fearGreedEnd >= market.fearGreedStart
                      ? "var(--color-gain)"
                      : "var(--color-loss)",
                  }}
                >
                  {market.fearGreedEnd >= market.fearGreedStart ? "+" : ""}
                  {market.fearGreedEnd - market.fearGreedStart}pt
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Macro Events */}
        {market.macroEvents.length > 0 && (
          <>
            <hr className="border-[var(--color-border-subtle)]" />
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                주간 매크로 이벤트
              </p>
              <ul className="space-y-1">
                {market.macroEvents.map((event, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[11px] text-[var(--color-text-secondary)]">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent-400)]" />
                    {event}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </Card>
  )
}
