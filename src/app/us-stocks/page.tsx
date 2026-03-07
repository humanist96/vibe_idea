import { USMarketOverview } from "@/components/us-stocks/USMarketOverview"
import { USTopStocksTable } from "@/components/us-stocks/USTopStocksTable"
import { USSearchBar } from "@/components/us-stocks/USSearchBar"
import { USEarningsCalendar } from "@/components/us-stocks/USEarningsCalendar"
import { USNewsFeed } from "@/components/us-stocks/USNewsFeed"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "해외 주식 - >koscom InvestHub",
}

export default function USStocksDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          해외 주식
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
          미국 주식 시장 실시간 분석
        </p>
      </div>

      <div className="animate-fade-up stagger-1">
        <USSearchBar />
      </div>

      <div className="animate-fade-up stagger-2">
        <USMarketOverview />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 animate-fade-up stagger-3">
          <USTopStocksTable />
        </div>
        <div className="space-y-6 animate-fade-up stagger-4">
          <USEarningsCalendar />
          <USNewsFeed />
        </div>
      </div>
    </div>
  )
}
