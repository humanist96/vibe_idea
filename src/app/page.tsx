import { MarketOverview } from "@/components/dashboard/MarketOverview"
import { TopStocksTable } from "@/components/dashboard/TopStocksTable"
import { MarketSummary } from "@/components/dashboard/MarketSummary"
import { InsiderActivityFeed } from "@/components/dashboard/InsiderActivityFeed"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="animate-fade-up">
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          대시보드
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
          한국 주식 시장 AI 분석 개요
        </p>
      </div>

      {/* Market indices */}
      <MarketOverview />

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 animate-fade-up stagger-4">
          <TopStocksTable />
        </div>
        <div className="space-y-6 animate-fade-up stagger-5">
          <MarketSummary />
          <InsiderActivityFeed />
        </div>
      </div>
    </div>
  )
}
