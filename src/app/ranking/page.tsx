"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { TrendingUp, TrendingDown } from "lucide-react"

type RankingType = "up" | "down"
type MarketType = "KOSPI" | "KOSDAQ"

interface RankingStock {
  readonly rank: number
  readonly ticker: string
  readonly name: string
  readonly price: number
  readonly change: number
  readonly changePercent: number
  readonly volume: number
  readonly marketCap: string
}

export default function RankingPage() {
  const [type, setType] = useState<RankingType>("up")
  const [market, setMarket] = useState<MarketType>("KOSPI")
  const [stocks, setStocks] = useState<readonly RankingStock[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const fetchRanking = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/ranking?type=${type}&market=${market}&page=${page}`)
      const json = await res.json()
      if (json.success) {
        setStocks(json.data.stocks)
        setTotalCount(json.data.totalCount)
      }
    } catch {
      setStocks([])
    } finally {
      setLoading(false)
    }
  }, [type, market, page])

  useEffect(() => {
    fetchRanking()
  }, [fetchRanking])

  const handleTypeChange = (newType: RankingType) => {
    setType(newType)
    setPage(1)
  }

  const handleMarketChange = (newMarket: MarketType) => {
    setMarket(newMarket)
    setPage(1)
  }

  const hasMore = stocks.length === 20 && page * 20 < totalCount

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">
          상승/하락 랭킹
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
          실시간 등락률 기준 종목 순위
        </p>
      </div>

      <Card className="animate-fade-up stagger-1">
        <CardHeader className="flex-col items-start gap-3 sm:flex-row sm:items-center">
          <CardTitle>
            {type === "up" ? "상승" : "하락"} 종목 · {market}
          </CardTitle>
          <div className="flex gap-2">
            <div className="flex gap-1">
              <Button
                variant={type === "up" ? "primary" : "ghost"}
                size="sm"
                onClick={() => handleTypeChange("up")}
              >
                <TrendingUp className="mr-1 h-3.5 w-3.5" />
                상승
              </Button>
              <Button
                variant={type === "down" ? "primary" : "ghost"}
                size="sm"
                onClick={() => handleTypeChange("down")}
              >
                <TrendingDown className="mr-1 h-3.5 w-3.5" />
                하락
              </Button>
            </div>
            <div className="flex gap-1">
              <Button
                variant={market === "KOSPI" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => handleMarketChange("KOSPI")}
              >
                KOSPI
              </Button>
              <Button
                variant={market === "KOSDAQ" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => handleMarketChange("KOSDAQ")}
              >
                KOSDAQ
              </Button>
            </div>
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
          <>
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
                      거래량
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stocks.map((stock) => (
                    <tr
                      key={stock.ticker}
                      className="table-row-hover border-b border-[var(--color-border-subtle)]"
                    >
                      <td className="py-2.5 text-sm tabular-nums text-[var(--color-text-muted)]">
                        {stock.rank}
                      </td>
                      <td className="py-2.5">
                        <Link
                          href={`/stock/${stock.ticker}`}
                          className="font-medium text-[var(--color-text-primary)] hover:text-[var(--color-accent-400)] transition-colors"
                        >
                          {stock.name}
                        </Link>
                        <span className="ml-1.5 text-[10px] text-[var(--color-text-muted)]">
                          {stock.ticker}
                        </span>
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-[var(--color-text-primary)]">
                        {stock.price.toLocaleString()}
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
                      <td className="py-2.5 text-right tabular-nums text-[var(--color-text-tertiary)] hidden sm:table-cell">
                        {stock.volume.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-3">
              <Button
                variant="ghost"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                이전
              </Button>
              <span className="text-xs text-[var(--color-text-muted)]">
                페이지 {page}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={!hasMore}
                onClick={() => setPage((p) => p + 1)}
              >
                다음
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
