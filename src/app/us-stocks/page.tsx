import { USMarketOverview } from "@/components/us-stocks/USMarketOverview"
import { USTopStocksTable } from "@/components/us-stocks/USTopStocksTable"
import { USSearchBar } from "@/components/us-stocks/USSearchBar"
import { USEarningsCalendar } from "@/components/us-stocks/USEarningsCalendar"
import { USNewsFeed } from "@/components/us-stocks/USNewsFeed"
import { USNewsImpactCard } from "@/components/us-stocks/USNewsImpactCard"
import { USMomentumBreakoutCard } from "@/components/us-stocks/USMomentumBreakoutCard"
import { USSectorRotationCard } from "@/components/us-stocks/USSectorRotationCard"
import { USSmartCompareWidget } from "@/components/us-stocks/USSmartCompareWidget"
import { RiskRadarCard } from "@/components/dashboard/RiskRadarCard"
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
          미국 주식 시장 AI 실시간 분석
        </p>
      </div>

      <div className="animate-fade-up stagger-1">
        <USSearchBar />
      </div>

      <div className="animate-fade-up stagger-2">
        <USMarketOverview />
      </div>

      {/* AI 핵심 카드: 뉴스 임팩트 + 리스크 레이더 + 섹터 로테이션 */}
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-fade-up stagger-3">
        <USNewsImpactCard />
        <RiskRadarCard />
        <USSectorRotationCard />
      </div>

      {/* AI 분석 카드: 모멘텀 브레이크아웃 */}
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-fade-up stagger-3">
        <USMomentumBreakoutCard />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6 animate-fade-up stagger-4">
          <USTopStocksTable />
          {/* AI 종목 비교 */}
          <USSmartCompareWidget />
        </div>
        <div className="space-y-6 animate-fade-up stagger-5">
          <USEarningsCalendar />
          <USNewsFeed />
        </div>
      </div>
    </div>
  )
}
