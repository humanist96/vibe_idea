import { MarketBar } from "@/components/dashboard/MarketBar"
import { TopStocksTable } from "@/components/dashboard/TopStocksTable"
import { MarketSummary } from "@/components/dashboard/MarketSummary"
import { InsiderActivityFeed } from "@/components/dashboard/InsiderActivityFeed"
import { RecentlyViewedStocks } from "@/components/dashboard/RecentlyViewedStocks"
import { FearGreedGauge } from "@/components/dashboard/FearGreedGauge"
import { WatchlistQuickView } from "@/components/dashboard/WatchlistQuickView"
import { IpoWidget } from "@/components/dashboard/IpoWidget"
import { NewsImpactCard } from "@/components/dashboard/NewsImpactCard"
import { RiskRadarCard } from "@/components/dashboard/RiskRadarCard"
import { MomentumBreakoutCard } from "@/components/dashboard/MomentumBreakoutCard"
import { SectorRotationCard } from "@/components/dashboard/SectorRotationCard"
import { EconomicCalendarCard } from "@/components/dashboard/EconomicCalendarCard"
import { SmartCompareWidget } from "@/components/dashboard/SmartCompareWidget"
import { FilingSummaryCard } from "@/components/dashboard/FilingSummaryCard"

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

      {/* Market Bar: indices + ticker tape */}
      <MarketBar />

      {/* AI 핵심 카드: 관심종목 + 뉴스 임팩트 + 리스크 레이더 */}
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-fade-up stagger-2">
        <WatchlistQuickView />
        <NewsImpactCard />
        <RiskRadarCard />
      </div>

      {/* Recently viewed stocks */}
      <RecentlyViewedStocks />

      {/* AI 분석 카드: 모멘텀 + 섹터 로테이션 + 경제 캘린더 */}
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-fade-up stagger-3">
        <MomentumBreakoutCard />
        <SectorRotationCard />
        <EconomicCalendarCard />
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6 animate-fade-up stagger-4">
          <TopStocksTable />
          {/* AI 종목 비교 */}
          <SmartCompareWidget />
        </div>
        <div className="space-y-6 animate-fade-up stagger-5">
          <FearGreedGauge />
          <FilingSummaryCard />
          <MarketSummary />
          <IpoWidget />
          <InsiderActivityFeed />
        </div>
      </div>
    </div>
  )
}
