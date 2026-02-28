"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { ScoreBadge } from "@/components/ui/ScoreBadge"
import { PriceChange } from "@/components/ui/PriceChange"
import { Badge } from "@/components/ui/Badge"
import { formatCurrency, formatVolume, formatMarketCap } from "@/lib/utils/format"
import { ChevronUp, ChevronDown } from "lucide-react"

interface StockRow {
  readonly ticker: string
  readonly name: string
  readonly price: number
  readonly change: number
  readonly changePercent: number
  readonly volume: number
  readonly marketCap: number
  readonly per: number | null
  readonly aiScore: number | null
  readonly market: "KOSPI" | "KOSDAQ"
  readonly sector: string
}

type SortField = "name" | "price" | "changePercent" | "volume" | "marketCap" | "per" | "aiScore"
type SortDirection = "asc" | "desc"

interface StockTableProps {
  readonly stocks: StockRow[]
}

export function StockTable({ stocks }: StockTableProps) {
  const [sortField, setSortField] = useState<SortField>("marketCap")
  const [sortDir, setSortDir] = useState<SortDirection>("desc")

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDir("desc")
    }
  }

  const sorted = useMemo(() => {
    return [...stocks].sort((a, b) => {
      const aVal = a[sortField] ?? 0
      const bVal = b[sortField] ?? 0
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

  const thClass = "pb-3 pr-4 text-xs text-gray-500 cursor-pointer hover:text-gray-700 select-none"

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left">
            <th className="pb-3 pr-4 text-xs text-gray-500">#</th>
            <th className={thClass} onClick={() => handleSort("name")}>
              종목 <SortIcon field="name" />
            </th>
            <th className={`${thClass} text-center`}>AI점수</th>
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
            <th className="pb-3 text-xs text-gray-500">시장</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((stock, index) => (
            <tr
              key={stock.ticker}
              className="border-b border-gray-50 transition-colors hover:bg-gray-50"
            >
              <td className="py-3 pr-4 text-gray-400">{index + 1}</td>
              <td className="py-3 pr-4">
                <Link href={`/stock/${stock.ticker}`} className="group">
                  <p className="font-medium text-gray-900 group-hover:text-blue-600">
                    {stock.name}
                  </p>
                  <p className="text-xs text-gray-400">{stock.ticker}</p>
                </Link>
              </td>
              <td className="py-3 text-center">
                {stock.aiScore !== null ? (
                  <ScoreBadge score={stock.aiScore} size="sm" />
                ) : (
                  <span className="text-xs text-gray-400">-</span>
                )}
              </td>
              <td className="py-3 pr-4 text-right font-mono font-medium">
                {formatCurrency(stock.price)}
              </td>
              <td className="py-3 pr-4 text-right">
                <PriceChange
                  change={stock.change}
                  changePercent={stock.changePercent}
                  showIcon={false}
                />
              </td>
              <td className="py-3 pr-4 text-right text-gray-500">
                {formatVolume(stock.volume)}
              </td>
              <td className="py-3 pr-4 text-right text-gray-500">
                {formatMarketCap(stock.marketCap)}
              </td>
              <td className="py-3 pr-4 text-right text-gray-500">
                {stock.per ? stock.per.toFixed(1) : "-"}
              </td>
              <td className="py-3">
                <Badge variant={stock.market === "KOSPI" ? "blue" : "green"}>
                  {stock.market}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {sorted.length === 0 && (
        <div className="py-12 text-center text-sm text-gray-400">
          조건에 맞는 종목이 없습니다.
        </div>
      )}
    </div>
  )
}
