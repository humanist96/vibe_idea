"use client"

import { USExecutiveSummary } from "./USExecutiveSummary"
import { USMarketContext } from "./USMarketContext"
import { USWatchlistOverview } from "./USWatchlistOverview"
import { USStockDeepDive } from "./USStockDeepDive"
import { USPortfolioInsight } from "./USPortfolioInsight"
import { USWatchPoints } from "./USWatchPoints"
import type { USAnalyzedReportData } from "@/lib/report/us-types"

const STOCK_COLORS = [
  "#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444",
  "#06b6d4", "#ec4899", "#84cc16", "#f97316", "#6366f1",
]

interface USDailyReportProps {
  readonly report: USAnalyzedReportData
}

export function USDailyReport({ report }: USDailyReportProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-up text-center">
        <h2 className="font-display text-xl font-bold text-[var(--color-text-primary)]">
          US Daily Analysis Report
        </h2>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          {report.date} · {report.stocks.length}개 종목 분석
        </p>
      </div>

      {/* Quick Jump */}
      <div className="animate-fade-up flex flex-wrap justify-center gap-1.5">
        {report.stocks.map((s, i) => (
          <a
            key={s.symbol}
            href={`#us-stock-${s.symbol}`}
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-50)]"
            style={{ borderColor: STOCK_COLORS[i % STOCK_COLORS.length] }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: STOCK_COLORS[i % STOCK_COLORS.length] }}
            />
            {s.nameKr}
          </a>
        ))}
      </div>

      <USExecutiveSummary summary={report.executiveSummary} date={report.date} />

      <USMarketContext market={report.market} />

      <USWatchlistOverview
        stocks={report.stocks}
        analyses={report.stockAnalyses}
      />

      {/* Per-Stock Deep Dives */}
      {report.stocks.map((stock, i) => (
        <div key={stock.symbol} id={`us-stock-${stock.symbol}`}>
          <USStockDeepDive
            stock={stock}
            analysis={report.stockAnalyses.find(
              (a) => a.symbol === stock.symbol
            )}
            color={STOCK_COLORS[i % STOCK_COLORS.length]}
          />
        </div>
      ))}

      <USPortfolioInsight
        stocks={report.stocks}
        insight={report.portfolioInsight}
      />

      <USWatchPoints points={report.watchPoints} />

      {/* Disclaimer */}
      <p className="text-center text-[10px] text-[var(--color-text-muted)] animate-fade-up">
        본 리포트는 AI가 공개 데이터를 기반으로 생성한 참고자료이며, 투자
        권유가 아닙니다.
      </p>
    </div>
  )
}
