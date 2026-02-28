"use client"

import { useEffect, useState, useCallback } from "react"
import dynamic from "next/dynamic"
import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"

const CandlestickChart = dynamic(
  () =>
    import("@/components/charts/CandlestickChart").then(
      (mod) => mod.CandlestickChart
    ),
  { ssr: false, loading: () => <LoadingSkeleton className="h-[400px] w-full" /> }
)

interface HistoricalData {
  readonly date: string
  readonly open: number
  readonly high: number
  readonly low: number
  readonly close: number
  readonly volume: number
}

type Period = "1mo" | "3mo" | "6mo" | "1y" | "3y"

const periods: { label: string; value: Period }[] = [
  { label: "1M", value: "1mo" },
  { label: "3M", value: "3mo" },
  { label: "6M", value: "6mo" },
  { label: "1Y", value: "1y" },
  { label: "3Y", value: "3y" },
]

interface PriceChartProps {
  readonly ticker: string
}

export function PriceChart({ ticker }: PriceChartProps) {
  const [data, setData] = useState<HistoricalData[]>([])
  const [period, setPeriod] = useState<Period>("3mo")
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/stocks/${ticker}/historical?period=${period}`
      )
      const json = await res.json()
      if (json.success) {
        setData(json.data)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [ticker, period])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <Card>
      <CardHeader>
        <CardTitle>가격 차트</CardTitle>
        <div className="flex gap-1">
          {periods.map((p) => (
            <Button
              key={p.value}
              variant={period === p.value ? "primary" : "ghost"}
              size="sm"
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      {loading ? (
        <LoadingSkeleton className="h-[400px] w-full" />
      ) : (
        <CandlestickChart data={data} height={400} />
      )}
    </Card>
  )
}
