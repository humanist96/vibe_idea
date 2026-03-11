import { MarketBar } from "./MarketBar"
import { WatchlistQuickView } from "./WatchlistQuickView"
import { NewsImpactCard } from "./NewsImpactCard"
import { RiskRadarCard } from "./RiskRadarCard"
import { RecentlyViewedStocks } from "./RecentlyViewedStocks"
import { MomentumBreakoutCard } from "./MomentumBreakoutCard"
import { SectorRotationCard } from "./SectorRotationCard"
import { EconomicCalendarCard } from "./EconomicCalendarCard"
import { TopStocksTable } from "./TopStocksTable"
import { SmartCompareWidget } from "./SmartCompareWidget"
import { FearGreedGauge } from "./FearGreedGauge"
import { FilingSummaryCard } from "./FilingSummaryCard"
import { MarketSummary } from "./MarketSummary"
import { IpoWidget } from "./IpoWidget"
import { InsiderActivityFeed } from "./InsiderActivityFeed"
import type { ComponentType } from "react"

export interface CardDefinition {
  readonly id: string
  readonly component: ComponentType
  readonly label: string
  readonly size: "full" | "1/3" | "2/3"
  readonly fixed?: boolean
}

export const CARD_DEFINITIONS: readonly CardDefinition[] = [
  { id: "marketBar", component: MarketBar, label: "시장 지표", size: "full", fixed: true },
  { id: "watchlist", component: WatchlistQuickView, label: "관심종목", size: "1/3" },
  { id: "newsImpact", component: NewsImpactCard, label: "뉴스 임팩트", size: "1/3" },
  { id: "riskRadar", component: RiskRadarCard, label: "리스크 레이더", size: "1/3" },
  { id: "recentlyViewed", component: RecentlyViewedStocks, label: "최근 본 종목", size: "full" },
  { id: "momentum", component: MomentumBreakoutCard, label: "모멘텀 브레이크아웃", size: "1/3" },
  { id: "sectorRotation", component: SectorRotationCard, label: "섹터 로테이션", size: "1/3" },
  { id: "economicCalendar", component: EconomicCalendarCard, label: "경제 캘린더", size: "1/3" },
  { id: "topStocks", component: TopStocksTable, label: "AI TOP 종목", size: "2/3" },
  { id: "smartCompare", component: SmartCompareWidget, label: "AI 종목 비교", size: "2/3" },
  { id: "fearGreed", component: FearGreedGauge, label: "공포·탐욕 지수", size: "1/3" },
  { id: "filingSummary", component: FilingSummaryCard, label: "공시 요약", size: "1/3" },
  { id: "marketSummary", component: MarketSummary, label: "시장 요약", size: "1/3" },
  { id: "ipo", component: IpoWidget, label: "IPO 일정", size: "1/3" },
  { id: "insiderActivity", component: InsiderActivityFeed, label: "내부자 거래", size: "1/3" },
] as const

export const DEFAULT_CARD_ORDER: readonly string[] = CARD_DEFINITIONS.map((c) => c.id)

export const CARD_MAP = new Map(CARD_DEFINITIONS.map((c) => [c.id, c]))

export function getCardDef(id: string): CardDefinition | undefined {
  return CARD_MAP.get(id)
}
