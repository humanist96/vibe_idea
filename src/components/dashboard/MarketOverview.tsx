"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { PriceChange } from "@/components/ui/PriceChange"
import { CardSkeleton } from "@/components/ui/LoadingSkeleton"
import { TrendingUp, BarChart3, DollarSign } from "lucide-react"
import { formatNumber } from "@/lib/utils/format"

interface MarketIndex {
  readonly name: string
  readonly value: number
  readonly change: number
  readonly changePercent: number
}

const icons: Record<string, typeof TrendingUp> = {
  KOSPI: TrendingUp,
  KOSDAQ: BarChart3,
  "USD/KRW": DollarSign,
}

export function MarketOverview() {
  const [indices, setIndices] = useState<MarketIndex[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/market")
        const json = await res.json()
        if (json.success) {
          setIndices(json.data)
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {indices.map((index) => {
        const Icon = icons[index.name] ?? TrendingUp
        return (
          <Card key={index.name}>
            <CardHeader>
              <CardTitle>{index.name}</CardTitle>
              <Icon className="h-5 w-5 text-gray-400" />
            </CardHeader>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {index.name === "USD/KRW"
                    ? `₩${formatNumber(Math.round(index.value))}`
                    : formatNumber(Number(index.value.toFixed(2)))}
                </p>
                <PriceChange
                  change={index.change}
                  changePercent={index.changePercent}
                  className="mt-1 text-sm"
                />
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
