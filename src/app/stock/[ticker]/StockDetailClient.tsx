"use client"

import { useEffect, useState } from "react"
import { useRecentlyViewedStore } from "@/store/recently-viewed"
import { StockHeader } from "@/components/stock/StockHeader"
import { PriceChart } from "@/components/stock/PriceChart"
import { StockMetrics } from "@/components/stock/StockMetrics"
import { FundamentalsTable } from "@/components/stock/FundamentalsTable"
import { InvestorFlowPanel } from "@/components/stock/InvestorFlowPanel"
import { InsiderActivityTable } from "@/components/stock/InsiderActivityTable"
import { CompanyInfo } from "@/components/stock/CompanyInfo"
import { AIScorePanel } from "@/components/stock/AIScorePanel"
import { ConsensusPanel } from "@/components/stock/ConsensusPanel"

import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { RecentlyViewedBar } from "@/components/stock/RecentlyViewedBar"
import { FairValueCard } from "@/components/stock/FairValueCard"
import { EntryExitCoachCard } from "@/components/stock/EntryExitCoachCard"
import { StockNewsFeed } from "@/components/stock/StockNewsFeed"

interface StockData {
  readonly ticker: string
  readonly name: string
  readonly price: number
  readonly change: number
  readonly changePercent: number
  readonly volume: number
  readonly marketCap: number
  readonly per: number | null
  readonly pbr: number | null
  readonly eps: number | null
  readonly dividendYield: number | null
  readonly fiftyTwoWeekHigh: number
  readonly fiftyTwoWeekLow: number
  readonly market: "KOSPI" | "KOSDAQ"
  readonly sector: string
}

interface StockDetailClientProps {
  readonly ticker: string
  readonly stockName: string
}

export function StockDetailClient({ ticker, stockName }: StockDetailClientProps) {
  const [stock, setStock] = useState<StockData | null>(null)
  const [loading, setLoading] = useState(true)
  const addRecentlyViewed = useRecentlyViewedStore((s) => s.addStock)

  useEffect(() => {
    addRecentlyViewed(ticker, stockName)
  }, [ticker, stockName, addRecentlyViewed])

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/stocks/${ticker}`)
        const json = await res.json()
        if (json.success) {
          setStock(json.data)
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [ticker])

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton className="h-20 w-full" />
        <LoadingSkeleton className="h-[400px] w-full" />
      </div>
    )
  }

  if (!stock) {
    return (
      <div className="py-20 text-center text-[var(--color-text-tertiary)]">
        종목 데이터를 불러올 수 없습니다.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <RecentlyViewedBar currentTicker={ticker} />

      <StockHeader
        ticker={stock.ticker}
        name={stockName}
        price={stock.price}
        change={stock.change}
        changePercent={stock.changePercent}
        market={stock.market}
        sector={stock.sector}
      />

      <div className="animate-fade-up stagger-2">
        <PriceChart ticker={ticker} />
      </div>

      <div className="animate-fade-up stagger-3">
        <AIScorePanel ticker={ticker} />
      </div>

      <StockMetrics
        per={stock.per}
        pbr={stock.pbr}
        eps={stock.eps}
        dividendYield={stock.dividendYield}
        marketCap={stock.marketCap}
        volume={stock.volume}
        fiftyTwoWeekHigh={stock.fiftyTwoWeekHigh}
        fiftyTwoWeekLow={stock.fiftyTwoWeekLow}
      />

      <ConsensusPanel ticker={ticker} currentPrice={stock.price} />

      {/* AI 적정주가 + 매매 타이밍 코치 */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2 animate-fade-up">
        <FairValueCard
          ticker={stock.ticker}
          name={stockName}
          currentPrice={stock.price}
          per={stock.per}
          pbr={stock.pbr}
          eps={stock.eps}
          dividendYield={stock.dividendYield}
          marketCap={stock.marketCap}
          sector={stock.sector}
        />
        <EntryExitCoachCard
          ticker={stock.ticker}
          name={stockName}
          currentPrice={stock.price}
          high52w={stock.fiftyTwoWeekHigh}
          low52w={stock.fiftyTwoWeekLow}
          per={stock.per}
          pbr={stock.pbr}
          volume={stock.volume}
          changePercent={stock.changePercent}
        />
      </div>

      <FundamentalsTable ticker={ticker} />

      <InvestorFlowPanel ticker={ticker} />

      <div className="animate-fade-up">
        <StockNewsFeed ticker={ticker} />
      </div>

      <InsiderActivityTable ticker={ticker} />

      <CompanyInfo
        ticker={ticker}
        stockName={stockName}
        market={stock.market}
        sector={stock.sector}
      />
    </div>
  )
}
