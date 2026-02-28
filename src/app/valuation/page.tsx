"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { Grid3X3 } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { Treemap, ResponsiveContainer, Tooltip } from "recharts"

interface StockVal {
  readonly ticker: string
  readonly name: string
  readonly marketCap: number
  readonly changePercent: number
  readonly per: number | null
  readonly pbr: number | null
}

interface SectorVal {
  readonly sector: string
  readonly stockCount: number
  readonly totalMarketCap: number
  readonly avgChangePercent: number
  readonly topStocks: readonly StockVal[]
}

function formatMarketCap(value: number): string {
  if (value >= 1_000_000_000_000) return `${(value / 1_000_000_000_000).toFixed(1)}조`
  if (value >= 100_000_000) return `${(value / 100_000_000).toFixed(0)}억`
  return value.toLocaleString("ko-KR")
}

const SECTOR_COLORS = [
  "#f59e0b", "#6366f1", "#10b981", "#ef4444", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#06b6d4", "#84cc16",
  "#a855f7", "#e11d48", "#0ea5e9", "#22c55e", "#d946ef",
]

interface TreemapContentProps {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
  readonly name: string
  readonly index: number
  readonly changePercent: number
}

function CustomTreemapContent({ x, y, width, height, name, index, changePercent }: TreemapContentProps) {
  if (width < 30 || height < 20) return null
  const color = SECTOR_COLORS[index % SECTOR_COLORS.length]
  const isUp = changePercent > 0

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={4}
        fill={color}
        fillOpacity={0.15}
        stroke={color}
        strokeWidth={1}
        strokeOpacity={0.4}
      />
      {width > 60 && height > 30 && (
        <>
          <text
            x={x + 8}
            y={y + 16}
            fill="var(--color-text-primary)"
            fontSize={11}
            fontWeight={600}
          >
            {name.length > Math.floor(width / 8) ? name.slice(0, Math.floor(width / 8)) + "…" : name}
          </text>
          {height > 40 && (
            <text
              x={x + 8}
              y={y + 32}
              fill={isUp ? "var(--color-gain)" : "var(--color-loss)"}
              fontSize={10}
              fontWeight={500}
            >
              {isUp ? "+" : ""}{changePercent.toFixed(2)}%
            </text>
          )}
        </>
      )}
    </g>
  )
}

export default function ValuationPage() {
  const [sectors, setSectors] = useState<SectorVal[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSector, setSelectedSector] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/valuation")
        const json = await res.json()
        if (json.success) setSectors(json.data)
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const treemapData = sectors.map((s, i) => ({
    name: s.sector,
    size: s.totalMarketCap,
    changePercent: s.avgChangePercent,
    index: i,
  }))

  const selectedData = selectedSector
    ? sectors.find((s) => s.sector === selectedSector)
    : null

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          밸류에이션 맵
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
          섹터별 시가총액 비중 및 밸류에이션 현황
        </p>
      </div>

      {loading ? (
        <div className="space-y-4 animate-fade-up stagger-2">
          <LoadingSkeleton className="h-80 w-full rounded-xl" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <LoadingSkeleton className="h-32 w-full rounded-lg" />
            <LoadingSkeleton className="h-32 w-full rounded-lg" />
            <LoadingSkeleton className="h-32 w-full rounded-lg" />
          </div>
        </div>
      ) : sectors.length === 0 ? (
        <Card className="animate-fade-up stagger-2">
          <div className="py-12 text-center">
            <p className="text-sm text-[var(--color-text-tertiary)]">
              밸류에이션 데이터를 불러올 수 없습니다
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* Treemap */}
          <Card className="animate-fade-up stagger-2 p-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <Treemap
                  data={treemapData}
                  dataKey="size"
                  stroke="var(--color-border-subtle)"
                  content={<CustomTreemapContent x={0} y={0} width={0} height={0} name="" index={0} changePercent={0} />}
                  onClick={(node: { name?: string }) => {
                    if (node?.name) {
                      setSelectedSector((prev) =>
                        prev === node.name ? null : (node.name ?? null)
                      )
                    }
                  }}
                >
                  <Tooltip
                    content={({ payload }) => {
                      if (!payload?.[0]) return null
                      const d = payload[0].payload as { name: string; size: number; changePercent: number }
                      return (
                        <div className="glass-card rounded-lg p-3 text-xs">
                          <p className="font-semibold text-[var(--color-text-primary)]">{d.name}</p>
                          <p className="text-[var(--color-text-tertiary)]">
                            시가총액: {formatMarketCap(d.size)}
                          </p>
                          <p className={cn(
                            d.changePercent > 0 ? "text-[var(--color-gain)]" : "text-[var(--color-loss)]"
                          )}>
                            {d.changePercent > 0 ? "+" : ""}{d.changePercent.toFixed(2)}%
                          </p>
                        </div>
                      )
                    }}
                  />
                </Treemap>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Sector Cards */}
          <div className="animate-fade-up stagger-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sectors.map((s, i) => (
              <button
                key={s.sector}
                type="button"
                onClick={() =>
                  setSelectedSector((prev) =>
                    prev === s.sector ? null : s.sector
                  )
                }
                className={cn(
                  "glass-card w-full rounded-xl p-4 text-left transition-all duration-200",
                  selectedSector === s.sector
                    ? "ring-2 ring-[var(--color-accent-500)] ring-offset-1 ring-offset-[var(--color-bg-primary)]"
                    : "hover:bg-[var(--color-surface-100)]"
                )}
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-sm"
                      style={{ backgroundColor: SECTOR_COLORS[i % SECTOR_COLORS.length] }}
                    />
                    <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                      {s.sector}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium tabular-nums",
                      s.avgChangePercent > 0
                        ? "text-[var(--color-gain)]"
                        : s.avgChangePercent < 0
                          ? "text-[var(--color-loss)]"
                          : "text-[var(--color-text-tertiary)]"
                    )}
                  >
                    {s.avgChangePercent > 0 ? "+" : ""}
                    {s.avgChangePercent.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between text-xs text-[var(--color-text-tertiary)]">
                  <span>시총 {formatMarketCap(s.totalMarketCap)}</span>
                  <span>{s.stockCount}종목</span>
                </div>
              </button>
            ))}
          </div>

          {/* Selected Sector Detail */}
          {selectedData && (
            <Card className="animate-fade-up">
              <CardHeader>
                <CardTitle>
                  <span className="flex items-center gap-2">
                    <Grid3X3 className="h-3.5 w-3.5 text-[var(--color-accent-500)]" />
                    {selectedData.sector} 상위 종목
                  </span>
                </CardTitle>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-border-subtle)]">
                      <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                        종목
                      </th>
                      <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                        시가총액
                      </th>
                      <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                        등락률
                      </th>
                      <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                        PER
                      </th>
                      <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                        PBR
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedData.topStocks.map((stock) => (
                      <tr
                        key={stock.ticker}
                        className="table-row-hover border-b border-[var(--color-border-subtle)] last:border-0"
                      >
                        <td className="py-2.5">
                          <Link
                            href={`/stock/${stock.ticker}`}
                            className="font-mono text-xs text-[var(--color-accent-500)] transition-colors hover:text-[var(--color-accent-400)]"
                          >
                            {stock.ticker}
                          </Link>
                          <span className="ml-2 text-xs text-[var(--color-text-secondary)]">
                            {stock.name}
                          </span>
                        </td>
                        <td className="py-2.5 text-right tabular-nums text-[var(--color-text-secondary)]">
                          {formatMarketCap(stock.marketCap)}
                        </td>
                        <td
                          className={cn(
                            "py-2.5 text-right tabular-nums font-medium",
                            stock.changePercent > 0
                              ? "text-[var(--color-gain)]"
                              : stock.changePercent < 0
                                ? "text-[var(--color-loss)]"
                                : "text-[var(--color-text-secondary)]"
                          )}
                        >
                          {stock.changePercent > 0 ? "+" : ""}
                          {stock.changePercent.toFixed(2)}%
                        </td>
                        <td className="py-2.5 text-right tabular-nums text-[var(--color-text-secondary)]">
                          {stock.per !== null ? stock.per.toFixed(1) : "-"}
                        </td>
                        <td className="py-2.5 text-right tabular-nums text-[var(--color-text-secondary)]">
                          {stock.pbr !== null ? stock.pbr.toFixed(2) : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
