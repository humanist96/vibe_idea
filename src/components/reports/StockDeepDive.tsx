"use client"

import Link from "next/link"
import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { MiniCandlestick } from "./charts/MiniCandlestick"
import { FiftyTwoWeekProgress } from "./charts/FiftyTwoWeekProgress"
import { MoveReasonsSection } from "./MoveReasonsSection"
import { SupplyDemandSection } from "./SupplyDemandSection"
import { TechnicalSection } from "./TechnicalSection"
import { NewsSentimentSection } from "./NewsSentimentSection"
import { ConsensusSection } from "./ConsensusSection"
import { InsiderSection } from "./InsiderSection"
import { PriceChange } from "@/components/ui/PriceChange"
import { formatCurrency } from "@/lib/utils/format"
import type { StockReportData, StockAnalysis } from "@/lib/report/types"

interface StockDeepDiveProps {
  readonly stock: StockReportData
  readonly analysis: StockAnalysis | undefined
  readonly color: string
}

export function StockDeepDive({ stock, analysis, color }: StockDeepDiveProps) {
  const q = stock.quote

  if (!q) return null

  return (
    <Card>
      {/* Stock Header */}
      <div className="border-b border-[var(--color-border-subtle)] p-4" style={{ borderTopWidth: 3, borderTopColor: color }}>
        <div className="flex items-center justify-between">
          <div>
            <Link href={`/stock/${stock.ticker}`} className="text-sm font-bold text-[var(--color-text-primary)] hover:underline">
              {stock.name}
            </Link>
            <span className="ml-2 text-[10px] font-mono text-[var(--color-text-muted)]">{stock.ticker}</span>
          </div>
          <div className="text-right">
            <p className="text-base font-bold tabular-nums text-[var(--color-text-primary)]">
              {formatCurrency(q.price)}
            </p>
            <PriceChange change={q.change} changePercent={q.changePercent} className="text-xs" />
          </div>
        </div>

        {stock.aiScore && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[10px] text-[var(--color-text-muted)]">AI 점수</span>
            <span className="text-sm font-bold text-[var(--color-accent-400)]">{stock.aiScore.aiScore.toFixed(1)}</span>
            <span className="text-[10px] text-[var(--color-text-muted)]">{stock.aiScore.rating}</span>
          </div>
        )}
      </div>

      <div className="space-y-6 p-4">
        {/* Price & Volume Chart */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">최근 가격 추이</p>
          <MiniCandlestick data={stock.historical} />
          <div className="mt-3">
            <FiftyTwoWeekProgress
              current={q.price}
              high={q.fiftyTwoWeekHigh}
              low={q.fiftyTwoWeekLow}
            />
          </div>
        </div>

        <hr className="border-[var(--color-border-subtle)]" />

        {/* Move Reasons */}
        <MoveReasonsSection
          analysis={analysis}
          changePercent={q.changePercent}
          stockName={stock.name}
        />

        <hr className="border-[var(--color-border-subtle)]" />

        {/* Supply & Demand */}
        <SupplyDemandSection investorFlow={stock.investorFlow} />

        <hr className="border-[var(--color-border-subtle)]" />

        {/* Technical Analysis */}
        <TechnicalSection
          technical={stock.technical}
          historical={stock.historical}
          currentPrice={q.price}
        />

        <hr className="border-[var(--color-border-subtle)]" />

        {/* News & Sentiment */}
        <NewsSentimentSection
          news={stock.news}
          sentiment={stock.sentiment}
          events={stock.events}
        />

        <hr className="border-[var(--color-border-subtle)]" />

        {/* Consensus */}
        <ConsensusSection consensus={stock.consensus} quote={q} />

        {/* Insider (conditional) */}
        <InsiderSection insider={stock.insider} blockHoldings={stock.blockHoldings} />
      </div>
    </Card>
  )
}
