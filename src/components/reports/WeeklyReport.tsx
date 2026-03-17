"use client"

import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { ExecutiveSummary } from "./ExecutiveSummary"
import { WeeklyHighlights } from "./WeeklyHighlights"
import { WeeklyMarketContext } from "./WeeklyMarketContext"
import { WeeklyStockDeepDive } from "./WeeklyStockDeepDive"
import { NextWeekOutlookCard } from "./NextWeekOutlookCard"
import { PerformanceBar } from "./charts/PerformanceBar"
import { AlertTriangle, FileText, BarChart3, Briefcase } from "lucide-react"
import { formatCurrency, formatNumber } from "@/lib/utils/format"
import { ACTION_BADGE_COLORS } from "./report-constants"
import type { WeeklyAnalyzedData } from "@/lib/report/weekly-types"

const STOCK_COLORS = [
  "#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444",
  "#06b6d4", "#ec4899", "#84cc16", "#f97316", "#14b8a6",
]

interface WeeklyReportProps {
  readonly report: WeeklyAnalyzedData
}

export function WeeklyReport({ report }: WeeklyReportProps) {
  const startStr = new Date(report.weekStart).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  })
  const endStr = new Date(report.weekEnd).toLocaleDateString("ko-KR", {
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
            주간 투자 분석 보고서
          </h1>
        </div>
        <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
          {startStr} ~ {endStr} · 관심종목 {report.stocks.length}개 분석
        </p>
      </div>

      {/* Quick Jump Chips */}
      <div className="animate-fade-up stagger-1 flex flex-wrap gap-2">
        {report.stocks.map((stock, i) => (
          <a
            key={stock.ticker}
            href={`#weekly-stock-${stock.ticker}`}
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-[var(--color-surface-50)]"
            style={{ borderColor: STOCK_COLORS[i % STOCK_COLORS.length] }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: STOCK_COLORS[i % STOCK_COLORS.length] }}
            />
            {stock.name}
            <span
              className="tabular-nums text-[10px]"
              style={{
                color: stock.weekChangePercent >= 0 ? "var(--color-gain)" : "var(--color-loss)",
              }}
            >
              {stock.weekChangePercent >= 0 ? "+" : ""}
              {stock.weekChangePercent.toFixed(1)}%
            </span>
          </a>
        ))}
      </div>

      {/* Executive Summary */}
      <div className="animate-fade-up stagger-2">
        <ExecutiveSummary summary={report.executiveSummary} date={`${startStr} ~ ${endStr}`} />
      </div>

      {/* Weekly Highlights */}
      {report.weeklyHighlights.length > 0 && (
        <Card className="animate-fade-up stagger-3 p-4">
          <WeeklyHighlights highlights={report.weeklyHighlights} />
        </Card>
      )}

      {/* Weekly Market Context */}
      <div className="animate-fade-up stagger-4">
        <WeeklyMarketContext market={report.market} />
      </div>

      {/* Watchlist Overview Table */}
      <div className="animate-fade-up">
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <BarChart3 className="h-3.5 w-3.5 text-[var(--color-accent-500)]" />
                관심종목 주간 성과 총괄
              </span>
            </CardTitle>
          </CardHeader>

          <div className="overflow-x-auto px-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--color-border-subtle)]">
                  <th className="pb-2 text-left font-semibold text-[var(--color-text-tertiary)]">종목</th>
                  <th className="pb-2 text-right font-semibold text-[var(--color-text-tertiary)]">종가</th>
                  <th className="pb-2 text-right font-semibold text-[var(--color-text-tertiary)]">주간등락</th>
                  <th className="hidden pb-2 text-right font-semibold text-[var(--color-text-tertiary)] sm:table-cell">거래량</th>
                  <th className="hidden pb-2 text-right font-semibold text-[var(--color-text-tertiary)] md:table-cell">외국인</th>
                  <th className="hidden pb-2 text-right font-semibold text-[var(--color-text-tertiary)] md:table-cell">기관</th>
                  <th className="hidden pb-2 text-center font-semibold text-[var(--color-text-tertiary)] lg:table-cell">확신도</th>
                  <th className="hidden pb-2 text-center font-semibold text-[var(--color-text-tertiary)] lg:table-cell">액션</th>
                </tr>
              </thead>
              <tbody>
                {report.stocks.map((stock) => {
                  const analysis = report.stockAnalyses.find((a) => a.ticker === stock.ticker)
                  const conviction = analysis?.conviction ?? stock.currentConviction
                  const actionItem = analysis?.actionItem

                  const convictionColor = conviction
                    ? conviction.score >= 7
                      ? "text-green-600"
                      : conviction.score >= 4
                        ? "text-amber-600"
                        : "text-red-600"
                    : ""

                  const foreignLabel = stock.weekForeignNet > 0
                    ? "순매수"
                    : stock.weekForeignNet < 0
                      ? "순매도"
                      : "-"

                  const institutionLabel = stock.weekInstitutionNet > 0
                    ? "순매수"
                    : stock.weekInstitutionNet < 0
                      ? "순매도"
                      : "-"

                  return (
                    <tr
                      key={stock.ticker}
                      className="table-row-hover border-b border-[var(--color-border-subtle)] last:border-0"
                    >
                      <td className="py-2 font-medium text-[var(--color-text-primary)]">
                        {stock.name}
                      </td>
                      <td className="py-2 text-right tabular-nums font-medium text-[var(--color-text-primary)]">
                        {formatCurrency(stock.weekClose)}
                      </td>
                      <td
                        className="py-2 text-right tabular-nums font-medium"
                        style={{
                          color: stock.weekChangePercent >= 0 ? "var(--color-gain)" : "var(--color-loss)",
                        }}
                      >
                        {stock.weekChangePercent >= 0 ? "+" : ""}
                        {stock.weekChangePercent.toFixed(2)}%
                      </td>
                      <td className="hidden py-2 text-right tabular-nums text-[var(--color-text-secondary)] sm:table-cell">
                        {formatNumber(stock.weekVolume)}
                      </td>
                      <td
                        className="hidden py-2 text-right text-[var(--color-text-secondary)] md:table-cell"
                        style={{
                          color: stock.weekForeignNet > 0
                            ? "var(--color-gain)"
                            : stock.weekForeignNet < 0
                              ? "var(--color-loss)"
                              : undefined,
                        }}
                      >
                        {foreignLabel}
                      </td>
                      <td
                        className="hidden py-2 text-right text-[var(--color-text-secondary)] md:table-cell"
                        style={{
                          color: stock.weekInstitutionNet > 0
                            ? "var(--color-gain)"
                            : stock.weekInstitutionNet < 0
                              ? "var(--color-loss)"
                              : undefined,
                        }}
                      >
                        {institutionLabel}
                      </td>
                      <td className="hidden py-2 text-center lg:table-cell">
                        {conviction ? (
                          <span className={`font-bold tabular-nums text-xs ${convictionColor}`}>
                            {conviction.score}/10
                          </span>
                        ) : (
                          <span className="text-[var(--color-text-muted)]">-</span>
                        )}
                      </td>
                      <td className="hidden py-2 text-center lg:table-cell">
                        {actionItem ? (
                          <span
                            className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${ACTION_BADGE_COLORS[actionItem.action] ?? "bg-gray-100 text-gray-700"}`}
                          >
                            {actionItem.action}
                          </span>
                        ) : (
                          <span className="text-[var(--color-text-muted)]">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Performance Bar Chart */}
          <div className="p-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              주간 등락률 비교
            </p>
            <PerformanceBar
              items={report.stocks.map((s) => ({
                name: s.name,
                changePercent: s.weekChangePercent,
              }))}
            />
          </div>
        </Card>
      </div>

      {/* Stock Deep Dives */}
      {report.stocks.map((stock, i) => (
        <div
          key={stock.ticker}
          id={`weekly-stock-${stock.ticker}`}
          className="scroll-mt-20 animate-fade-up"
        >
          <WeeklyStockDeepDive
            stock={stock}
            analysis={report.stockAnalyses.find((a) => a.ticker === stock.ticker)}
            color={STOCK_COLORS[i % STOCK_COLORS.length]}
          />
        </div>
      ))}

      {/* Portfolio Insight */}
      {report.stocks.length >= 2 && report.portfolioInsight && (
        <Card className="animate-fade-up p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Briefcase className="h-3.5 w-3.5 text-[var(--color-accent-500)]" />
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                주간 포트폴리오 인사이트
              </h3>
            </div>
            <p className="rounded-lg bg-[var(--color-surface-50)] p-3 text-xs leading-relaxed text-[var(--color-text-secondary)]">
              {report.portfolioInsight}
            </p>
          </div>
        </Card>
      )}

      {/* Next Week Outlook */}
      <div className="animate-fade-up">
        <NextWeekOutlookCard outlook={report.nextWeekOutlook} />
      </div>

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
