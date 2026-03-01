"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { PriceChange } from "@/components/ui/PriceChange"
import { Badge } from "@/components/ui/Badge"
import { formatCurrency, formatVolume, formatMarketCap } from "@/lib/utils/format"
import { ChevronUp, ChevronDown, Star } from "lucide-react"
import { useWatchlistStore } from "@/store/watchlist"

interface StockRow {
  readonly ticker: string
  readonly name: string
  readonly price: number
  readonly change: number
  readonly changePercent: number
  readonly volume: number
  readonly marketCap: number
  readonly per: number | null
  readonly pbr: number | null
  readonly dividendYield: number | null
  readonly market: "KOSPI" | "KOSDAQ"
  readonly sector: string
}

type SortField = "name" | "price" | "changePercent" | "volume" | "marketCap" | "per" | "pbr" | "dividendYield"
type SortDirection = "asc" | "desc"

interface StockTableProps {
  readonly stocks: StockRow[]
}

export function StockTable({ stocks }: StockTableProps) {
  const [sortField, setSortField] = useState<SortField>("marketCap")
  const [sortDir, setSortDir] = useState<SortDirection>("desc")
  const { tickers: watchlist, addTicker, removeTicker } = useWatchlistStore()

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDir("desc")
    }
  }

  const toggleWatchlist = (ticker: string) => {
    if (watchlist.includes(ticker)) {
      removeTicker(ticker)
    } else {
      addTicker(ticker)
    }
  }

  const sorted = useMemo(() => {
    return [...stocks].sort((a, b) => {
      const aVal = a[sortField] ?? -Infinity
      const bVal = b[sortField] ?? -Infinity
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }
      return sortDir === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number)
    })
  }, [stocks, sortField, sortDir])

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortDir === "asc" ? (
      <ChevronUp className="inline h-3 w-3" />
    ) : (
      <ChevronDown className="inline h-3 w-3" />
    )
  }

  const thClass =
    "pb-3 pr-4 text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-muted)] cursor-pointer select-none hover:text-[var(--color-text-secondary)] transition-colors"

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border-subtle)] text-left">
            <th className="pb-3 pr-2 text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
              {/* Star column */}
            </th>
            <th className="pb-3 pr-4 text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
              #
            </th>
            <th className={thClass} onClick={() => handleSort("name")}>
              종목 <SortIcon field="name" />
            </th>
            <th className={`${thClass} text-right`} onClick={() => handleSort("price")}>
              현재가 <SortIcon field="price" />
            </th>
            <th className={`${thClass} text-right`} onClick={() => handleSort("changePercent")}>
              등락률 <SortIcon field="changePercent" />
            </th>
            <th className={`${thClass} text-right`} onClick={() => handleSort("volume")}>
              거래량 <SortIcon field="volume" />
            </th>
            <th className={`${thClass} text-right`} onClick={() => handleSort("marketCap")}>
              시총 <SortIcon field="marketCap" />
            </th>
            <th className={`${thClass} text-right`} onClick={() => handleSort("per")}>
              PER <SortIcon field="per" />
            </th>
            <th className={`${thClass} text-right`} onClick={() => handleSort("pbr")}>
              PBR <SortIcon field="pbr" />
            </th>
            <th className={`${thClass} text-right hidden lg:table-cell`} onClick={() => handleSort("dividendYield")}>
              배당률 <SortIcon field="dividendYield" />
            </th>
            <th className="pb-3 text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
              시장
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((stock, index) => {
            const isWatched = watchlist.includes(stock.ticker)
            return (
              <tr
                key={stock.ticker}
                className="table-row-hover border-b border-[var(--color-border-subtle)]"
              >
                <td className="py-3 pr-2">
                  <button
                    type="button"
                    onClick={() => toggleWatchlist(stock.ticker)}
                    className="rounded p-0.5 transition-colors hover:text-yellow-400"
                  >
                    <Star
                      className={`h-4 w-4 ${
                        isWatched
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-[var(--color-text-muted)]"
                      }`}
                    />
                  </button>
                </td>
                <td className="py-3 pr-4 text-xs tabular-nums text-[var(--color-text-muted)]">
                  {index + 1}
                </td>
                <td className="py-3 pr-4">
                  <Link href={`/stock/${stock.ticker}`} className="group">
                    <p className="font-medium text-[var(--color-text-primary)] group-hover:text-[var(--color-accent-400)] transition-colors">
                      {stock.name}
                    </p>
                    <p className="font-mono text-[10px] text-[var(--color-text-muted)]">
                      {stock.ticker}
                    </p>
                  </Link>
                </td>
                <td className="py-3 pr-4 text-right font-mono text-sm tabular-nums font-medium text-[var(--color-text-primary)]">
                  {formatCurrency(stock.price)}
                </td>
                <td className="py-3 pr-4 text-right">
                  <PriceChange
                    change={stock.change}
                    changePercent={stock.changePercent}
                    showIcon={false}
                  />
                </td>
                <td className="py-3 pr-4 text-right font-mono text-xs tabular-nums text-[var(--color-text-secondary)]">
                  {formatVolume(stock.volume)}
                </td>
                <td className="py-3 pr-4 text-right font-mono text-xs tabular-nums text-[var(--color-text-secondary)]">
                  {formatMarketCap(stock.marketCap)}
                </td>
                <td className="py-3 pr-4 text-right font-mono text-xs tabular-nums text-[var(--color-text-secondary)]">
                  {stock.per !== null ? stock.per.toFixed(1) : "--"}
                </td>
                <td className="py-3 pr-4 text-right font-mono text-xs tabular-nums text-[var(--color-text-secondary)]">
                  {stock.pbr !== null ? stock.pbr.toFixed(2) : "--"}
                </td>
                <td className="py-3 pr-4 text-right font-mono text-xs tabular-nums text-[var(--color-text-secondary)] hidden lg:table-cell">
                  {stock.dividendYield !== null ? `${stock.dividendYield.toFixed(2)}%` : "--"}
                </td>
                <td className="py-3">
                  <Badge variant={stock.market === "KOSPI" ? "blue" : "green"}>
                    {stock.market}
                  </Badge>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {sorted.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-sm text-[var(--color-text-muted)]">
            조건에 맞는 종목이 없습니다.
          </p>
        </div>
      )}
    </div>
  )
}
