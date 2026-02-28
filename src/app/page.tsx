import { MarketOverview } from "@/components/dashboard/MarketOverview"
import { TopStocksTable } from "@/components/dashboard/TopStocksTable"
import { MarketSummary } from "@/components/dashboard/MarketSummary"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <p className="mt-1 text-sm text-gray-500">
          한국 주식 시장 AI 분석 개요
        </p>
      </div>

      <MarketOverview />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TopStocksTable />
        </div>
        <div>
          <MarketSummary />
        </div>
      </div>
    </div>
  )
}
