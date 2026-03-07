"use client"

import { Card } from "@/components/ui/Card"
import { ExecutiveSummary } from "./ExecutiveSummary"
import { MarketContext } from "./MarketContext"
import { WatchlistOverview } from "./WatchlistOverview"
import { StockDeepDive } from "./StockDeepDive"
import { PortfolioInsight } from "./PortfolioInsight"
import { WatchPoints } from "./WatchPoints"
import { AlertTriangle, FileText } from "lucide-react"
import type { AnalyzedReportData } from "@/lib/report/types"

const STOCK_COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444", "#06b6d4", "#ec4899", "#84cc16", "#f97316", "#14b8a6"]

interface DailyReportProps {
  readonly report: AnalyzedReportData
}

export function DailyReport({ report }: DailyReportProps) {
  const dateStr = new Date(report.date).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-up">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-[var(--color-accent-500)]" />
          <h1 className="font-display text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
            데일리 투자 분석 보고서
          </h1>
        </div>
        <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
          {dateStr} · 관심종목 {report.stocks.length}개 분석
        </p>
      </div>

      {/* Quick Jump Chips */}
      <div className="animate-fade-up stagger-1 flex flex-wrap gap-2">
        {report.stocks.map((stock, i) => (
          <a
            key={stock.ticker}
            href={`#stock-${stock.ticker}`}
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-[var(--color-surface-50)]"
            style={{ borderColor: STOCK_COLORS[i % STOCK_COLORS.length] }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: STOCK_COLORS[i % STOCK_COLORS.length] }}
            />
            {stock.name}
            {stock.quote && (
              <span
                className="tabular-nums text-[10px]"
                style={{ color: stock.quote.changePercent >= 0 ? "var(--color-gain)" : "var(--color-loss)" }}
              >
                {stock.quote.changePercent >= 0 ? "+" : ""}{stock.quote.changePercent.toFixed(1)}%
              </span>
            )}
          </a>
        ))}
      </div>

      {/* Executive Summary */}
      <div className="animate-fade-up stagger-2">
        <ExecutiveSummary summary={report.executiveSummary} date={dateStr} />
      </div>

      {/* Market Context */}
      <div className="animate-fade-up stagger-3">
        <MarketContext market={report.market} />
      </div>

      {/* Watchlist Overview */}
      <div className="animate-fade-up stagger-4">
        <WatchlistOverview stocks={report.stocks} analyses={report.stockAnalyses} />
      </div>

      {/* Stock Deep Dives */}
      {report.stocks.map((stock, i) => (
        <div key={stock.ticker} id={`stock-${stock.ticker}`} className="scroll-mt-20 animate-fade-up">
          <StockDeepDive
            stock={stock}
            analysis={report.stockAnalyses.find((a) => a.ticker === stock.ticker)}
            color={STOCK_COLORS[i % STOCK_COLORS.length]}
          />
        </div>
      ))}

      {/* Portfolio Insight */}
      {report.stocks.length >= 2 && (
        <Card className="animate-fade-up p-4">
          <PortfolioInsight stocks={report.stocks} insight={report.portfolioInsight} />
        </Card>
      )}

      {/* Watch Points */}
      {report.watchPoints.length > 0 && (
        <Card className="animate-fade-up p-4">
          <WatchPoints points={report.watchPoints} />
        </Card>
      )}

      {/* Disclaimer */}
      <div className="animate-fade-up rounded-lg border border-amber-200/50 bg-amber-50/30 p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
          <div>
            <p className="text-[10px] font-medium text-amber-700">투자 면책 조항</p>
            <p className="mt-0.5 text-[10px] leading-relaxed text-amber-600/80">
              본 보고서는 AI가 공개 데이터를 기반으로 생성한 참고 자료이며, 투자 권유가 아닙니다.
              투자 결정은 본인의 판단과 책임 하에 이루어져야 합니다.
            </p>
            <p className="mt-1 text-[9px] text-[var(--color-text-muted)]">
              생성: {new Date(report.generatedAt).toLocaleString("ko-KR")}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
