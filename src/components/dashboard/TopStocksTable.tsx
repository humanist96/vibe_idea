"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { ScoreBadge } from "@/components/ui/ScoreBadge"
import { PriceChange } from "@/components/ui/PriceChange"
import { TableRowSkeleton } from "@/components/ui/LoadingSkeleton"
import { formatCurrency, formatVolume } from "@/lib/utils/format"
import { Badge } from "@/components/ui/Badge"

interface StockRow {
  readonly ticker: string
  readonly name: string
  readonly price: number
  readonly change: number
  readonly changePercent: number
  readonly volume: number
  readonly aiScore: number | null
  readonly market: "KOSPI" | "KOSDAQ"
  readonly sector: string
}

export function TopStocksTable() {
  const [stocks, setStocks] = useState<StockRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/stocks")
        const json = await res.json()
        if (json.success) {
          setStocks(json.data)
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>주요 종목</CardTitle>
        <Link
          href="/screener"
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          전체보기 →
        </Link>
      </CardHeader>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
              <th className="pb-3 pr-4">#</th>
              <th className="pb-3 pr-4">종목</th>
              <th className="pb-3 pr-4 text-right">현재가</th>
              <th className="pb-3 pr-4 text-right">등락률</th>
              <th className="pb-3 pr-4 text-right">거래량</th>
              <th className="pb-3 pr-4">시장</th>
              <th className="pb-3 text-center">AI 점수</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={7} className="py-1">
                    <TableRowSkeleton />
                  </td>
                </tr>
              ))
            ) : (
              stocks.map((stock, index) => (
                <tr
                  key={stock.ticker}
                  className="border-b border-gray-50 transition-colors hover:bg-gray-50"
                >
                  <td className="py-3 pr-4 text-gray-400">{index + 1}</td>
                  <td className="py-3 pr-4">
                    <Link
                      href={`/stock/${stock.ticker}`}
                      className="group"
                    >
                      <p className="font-medium text-gray-900 group-hover:text-blue-600">
                        {stock.name}
                      </p>
                      <p className="text-xs text-gray-400">{stock.ticker}</p>
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-right font-mono font-medium">
                    {formatCurrency(stock.price)}
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <PriceChange
                      change={stock.change}
                      changePercent={stock.changePercent}
                      showIcon={false}
                      className="text-sm"
                    />
                  </td>
                  <td className="py-3 pr-4 text-right text-gray-500">
                    {formatVolume(stock.volume)}
                  </td>
                  <td className="py-3 pr-4">
                    <Badge
                      variant={
                        stock.market === "KOSPI" ? "blue" : "green"
                      }
                    >
                      {stock.market}
                    </Badge>
                  </td>
                  <td className="py-3 text-center">
                    {stock.aiScore !== null ? (
                      <ScoreBadge score={stock.aiScore} size="sm" />
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
