"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { Layers, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils/cn"

interface ThemeSummary {
  readonly id: string
  readonly name: string
  readonly nameKr: string
  readonly description: string
  readonly color: string
  readonly stockCount: number
  readonly avgChange: number
}

interface ThemeDetail {
  readonly id: string
  readonly name: string
  readonly nameKr: string
  readonly description: string
  readonly color: string
  readonly avgChange: number
  readonly stocks: readonly {
    readonly symbol: string
    readonly name: string
    readonly nameKr: string
    readonly price: number
    readonly change: number
    readonly changePercent: number
  }[]
}

export default function USThemesPage() {
  const [themes, setThemes] = useState<ThemeSummary[]>([])
  const [selectedTheme, setSelectedTheme] = useState<ThemeDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    async function fetchThemes() {
      try {
        const res = await fetch("/api/us-stocks/themes")
        const json = await res.json()
        if (json.success) setThemes(json.data)
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchThemes()
  }, [])

  const handleSelectTheme = async (id: string) => {
    if (selectedTheme?.id === id) {
      setSelectedTheme(null)
      return
    }

    setDetailLoading(true)
    try {
      const res = await fetch(`/api/us-stocks/themes?id=${id}`)
      const json = await res.json()
      if (json.success) setSelectedTheme(json.data)
    } catch {
      // silently fail
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          US 테마
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
          주요 투자 테마별 종목 현황
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-fade-up stagger-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-fade-up stagger-2">
          {themes.map((theme) => (
            <button
              key={theme.id}
              type="button"
              onClick={() => handleSelectTheme(theme.id)}
              className={cn(
                "glass-card rounded-xl p-4 text-left transition-all hover:shadow-md",
                selectedTheme?.id === theme.id && "ring-2 ring-[var(--color-accent-400)]"
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: theme.color }}
                    />
                    <p className="font-semibold text-[var(--color-text-primary)]">
                      {theme.nameKr}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
                    {theme.description}
                  </p>
                </div>
                <ChevronRight
                  className={cn(
                    "h-4 w-4 text-[var(--color-text-muted)] transition-transform",
                    selectedTheme?.id === theme.id && "rotate-90"
                  )}
                />
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-[10px] text-[var(--color-text-muted)]">
                  {theme.stockCount}종목
                </span>
                <span
                  className={cn(
                    "text-sm font-bold tabular-nums",
                    theme.avgChange > 0
                      ? "text-[var(--color-gain)]"
                      : theme.avgChange < 0
                        ? "text-[var(--color-loss)]"
                        : "text-[var(--color-text-tertiary)]"
                  )}
                >
                  {theme.avgChange > 0 ? "+" : ""}
                  {theme.avgChange.toFixed(2)}%
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Theme Detail */}
      {detailLoading && (
        <LoadingSkeleton className="h-64 w-full rounded-lg" />
      )}

      {selectedTheme && !detailLoading && (
        <Card className="animate-fade-up">
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: selectedTheme.color }}
                />
                {selectedTheme.nameKr} 구성종목
              </span>
            </CardTitle>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border-subtle)]">
                  <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">종목</th>
                  <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">현재가</th>
                  <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">등락</th>
                  <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">등락률</th>
                </tr>
              </thead>
              <tbody>
                {selectedTheme.stocks.map((stock) => (
                  <tr key={stock.symbol} className="table-row-hover border-b border-[var(--color-border-subtle)] last:border-0">
                    <td className="py-2.5">
                      <Link
                        href={`/us-stocks/${stock.symbol}`}
                        className="font-medium text-[var(--color-text-primary)] hover:text-[var(--color-accent-400)] transition-colors"
                      >
                        {stock.nameKr}
                      </Link>
                      <span className="ml-1.5 text-[10px] text-[var(--color-text-muted)]">{stock.symbol}</span>
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-[var(--color-text-primary)]">
                      ${stock.price.toFixed(2)}
                    </td>
                    <td className={cn(
                      "py-2.5 text-right tabular-nums",
                      stock.change > 0
                        ? "text-[var(--color-gain)]"
                        : stock.change < 0
                          ? "text-[var(--color-loss)]"
                          : "text-[var(--color-text-tertiary)]"
                    )}>
                      {stock.change > 0 ? "+" : ""}{stock.change.toFixed(2)}
                    </td>
                    <td className={cn(
                      "py-2.5 text-right tabular-nums font-medium",
                      stock.changePercent > 0
                        ? "text-[var(--color-gain)]"
                        : stock.changePercent < 0
                          ? "text-[var(--color-loss)]"
                          : "text-[var(--color-text-tertiary)]"
                    )}>
                      {stock.changePercent > 0 ? "+" : ""}{stock.changePercent.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
