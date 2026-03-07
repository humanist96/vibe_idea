"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { Search, Filter } from "lucide-react"
import { cn } from "@/lib/utils/cn"

interface ScreenerStock {
  readonly symbol: string
  readonly name: string
  readonly nameKr: string
  readonly sector: string
  readonly sectorKr: string
  readonly exchange: string
  readonly price: number
  readonly changePercent: number
  readonly marketCap: number | null
  readonly pe: number | null
  readonly pb: number | null
  readonly dividendYield: number | null
  readonly beta: number | null
  readonly roe: number | null
}

const SECTORS = [
  "전체", "Technology", "Healthcare", "Financials", "Consumer Discretionary",
  "Consumer Staples", "Communication Services", "Industrials", "Energy",
  "Utilities", "Real Estate", "Materials",
]

type SortKey = "changePercent" | "marketCap" | "pe" | "pb" | "dividendYield" | "roe"

export default function USScreenerPage() {
  const [stocks, setStocks] = useState<readonly ScreenerStock[]>([])
  const [loading, setLoading] = useState(true)
  const [sector, setSector] = useState("전체")
  const [sortBy, setSortBy] = useState<SortKey>("marketCap")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [showFilters, setShowFilters] = useState(false)
  const router = useRouter()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ sortBy, sortDir })
      if (sector !== "전체") params.set("sector", sector)

      const res = await fetch(`/api/us-stocks/screener?${params}`)
      const json = await res.json()
      if (json.success) setStocks(json.data)
    } catch {
      setStocks([])
    } finally {
      setLoading(false)
    }
  }, [sector, sortBy, sortDir])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortBy(key)
      setSortDir("desc")
    }
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-up flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            US 스크리너
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
            S&P 500 주요 종목 필터링 및 비교
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="mr-1 h-3.5 w-3.5" />
          필터
        </Button>
      </div>

      {showFilters && (
        <Card className="animate-fade-up stagger-1">
          <div className="space-y-3">
            <p className="text-xs font-semibold text-[var(--color-text-secondary)]">섹터</p>
            <div className="flex flex-wrap gap-1.5">
              {SECTORS.map((s) => (
                <Button
                  key={s}
                  variant={sector === s ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => setSector(s)}
                >
                  {s === "전체" ? s : s.split(" ")[0]}
                </Button>
              ))}
            </div>
          </div>
        </Card>
      )}

      <Card className="animate-fade-up stagger-2">
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5 text-[var(--color-accent-500)]" />
              종목 리스트
              <span className="text-xs font-normal text-[var(--color-text-tertiary)]">
                ({stocks.length}종목)
              </span>
            </span>
          </CardTitle>
        </CardHeader>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <LoadingSkeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border-subtle)]">
                  <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                    종목
                  </th>
                  {[
                    { key: "changePercent" as const, label: "등락률" },
                    { key: "marketCap" as const, label: "시총(M$)" },
                    { key: "pe" as const, label: "PER" },
                    { key: "pb" as const, label: "PBR" },
                    { key: "dividendYield" as const, label: "배당률" },
                    { key: "roe" as const, label: "ROE" },
                  ].map((col) => (
                    <th
                      key={col.key}
                      className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]"
                    >
                      <button
                        type="button"
                        onClick={() => handleSort(col.key)}
                        className={cn(
                          "inline-flex items-center gap-0.5 transition-colors hover:text-[var(--color-text-secondary)]",
                          sortBy === col.key && "text-[var(--color-accent-500)]"
                        )}
                      >
                        {col.label}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stocks.map((stock) => (
                  <tr
                    key={stock.symbol}
                    className="table-row-hover border-b border-[var(--color-border-subtle)] cursor-pointer"
                    onClick={() => router.push(`/us-stocks/${stock.symbol}`)}
                  >
                    <td className="py-2.5">
                      <Link
                        href={`/us-stocks/${stock.symbol}`}
                        className="font-medium text-[var(--color-text-primary)] hover:text-[var(--color-accent-400)] transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {stock.nameKr}
                      </Link>
                      <span className="ml-1.5 text-[10px] text-[var(--color-text-muted)]">
                        {stock.symbol}
                      </span>
                      <span className="ml-1 text-[10px] text-[var(--color-text-muted)] hidden sm:inline">
                        · {stock.sectorKr}
                      </span>
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
                    <td className="py-2.5 text-right tabular-nums text-[var(--color-text-secondary)]">
                      {stock.marketCap ? Math.round(stock.marketCap).toLocaleString() : "-"}
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-[var(--color-text-secondary)]">
                      {stock.pe ? stock.pe.toFixed(1) : "-"}
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-[var(--color-text-secondary)]">
                      {stock.pb ? stock.pb.toFixed(2) : "-"}
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-[var(--color-text-secondary)]">
                      {stock.dividendYield ? `${stock.dividendYield.toFixed(2)}%` : "-"}
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-[var(--color-text-secondary)]">
                      {stock.roe ? `${stock.roe.toFixed(1)}%` : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
