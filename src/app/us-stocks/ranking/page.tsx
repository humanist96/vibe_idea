"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { TrendingUp, TrendingDown } from "lucide-react"

type RankingType = "up" | "down"

interface RankingStock {
  readonly rank: number
  readonly symbol: string
  readonly name: string
  readonly nameKr: string
  readonly price: number
  readonly change: number
  readonly changePercent: number
  readonly sector: string
  readonly sectorKr: string
  readonly exchange: string
}

export default function USRankingPage() {
  const [type, setType] = useState<RankingType>("up")
  const [stocks, setStocks] = useState<readonly RankingStock[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRanking = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/us-stocks/ranking?type=${type}`)
      const json = await res.json()
      if (json.success) {
        setStocks(json.data)
      }
    } catch {
      setStocks([])
    } finally {
      setLoading(false)
    }
  }, [type])

  useEffect(() => {
    fetchRanking()
  }, [fetchRanking])

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">
          US 상승/하락 랭킹
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
          S&P 500 주요 종목 등락률 순위
        </p>
      </div>

      <Card className="animate-fade-up stagger-1">
        <CardHeader className="flex-col items-start gap-3 sm:flex-row sm:items-center">
          <CardTitle>
            {type === "up" ? "상승" : "하락"} 종목
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant={type === "up" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setType("up")}
            >
              <TrendingUp className="mr-1 h-3.5 w-3.5" />
              상승
            </Button>
            <Button
              variant={type === "down" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setType("down")}
            >
              <TrendingDown className="mr-1 h-3.5 w-3.5" />
              하락
            </Button>
          </div>
        </CardHeader>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <LoadingSkeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : stocks.length === 0 ? (
          <div className="py-12 text-center text-sm text-[var(--color-text-muted)]">
            데이터가 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border-subtle)]">
                  <th className="py-2 text-left text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-muted)] w-10">
                    #
                  </th>
                  <th className="py-2 text-left text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
                    종목
                  </th>
                  <th className="py-2 text-right text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
                    현재가
                  </th>
                  <th className="py-2 text-right text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
                    등락률
                  </th>
                  <th className="py-2 text-right text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-muted)] hidden sm:table-cell">
                    섹터
                  </th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((stock) => (
                  <tr
                    key={stock.symbol}
                    className="table-row-hover border-b border-[var(--color-border-subtle)]"
                  >
                    <td className="py-2.5 text-sm tabular-nums text-[var(--color-text-muted)]">
                      {stock.rank}
                    </td>
                    <td className="py-2.5">
                      <Link
                        href={`/us-stocks/${stock.symbol}`}
                        className="font-medium text-[var(--color-text-primary)] hover:text-[var(--color-accent-400)] transition-colors"
                      >
                        {stock.nameKr}
                      </Link>
                      <span className="ml-1.5 text-[10px] text-[var(--color-text-muted)]">
                        {stock.symbol}
                      </span>
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-[var(--color-text-primary)]">
                      ${stock.price.toFixed(2)}
                    </td>
                    <td
                      className={`py-2.5 text-right tabular-nums font-medium ${
                        stock.changePercent > 0
                          ? "text-[var(--color-gain)]"
                          : stock.changePercent < 0
                            ? "text-[var(--color-loss)]"
                            : "text-[var(--color-text-tertiary)]"
                      }`}
                    >
                      {stock.changePercent > 0 ? "+" : ""}
                      {stock.changePercent.toFixed(2)}%
                    </td>
                    <td className="py-2.5 text-right text-xs text-[var(--color-text-tertiary)] hidden sm:table-cell">
                      {stock.sectorKr}
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
