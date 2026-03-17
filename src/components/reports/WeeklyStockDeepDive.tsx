"use client"

import Link from "next/link"
import { Card } from "@/components/ui/Card"
import { ConvictionScoreCard } from "./ConvictionScoreCard"
import { ActionItemCard } from "./ActionItemCard"
import { RiskAlertBadges } from "./RiskAlertBadges"
import { AnalystDigestSection } from "./AnalystDigestSection"
import { ConsensusChangeCard } from "./ConsensusChangeCard"
import { PriceChange } from "@/components/ui/PriceChange"
import { formatCurrency, formatNumber, formatVolume } from "@/lib/utils/format"
import { Users, Building2 } from "lucide-react"
import type { WeeklyStockData, WeeklyStockAnalysis } from "@/lib/report/weekly-types"

interface WeeklyStockDeepDiveProps {
  readonly stock: WeeklyStockData
  readonly analysis: WeeklyStockAnalysis | undefined
  readonly color: string
}

export function WeeklyStockDeepDive({ stock, analysis, color }: WeeklyStockDeepDiveProps) {
  // Build a minimal quote-like object for AnalystDigestSection
  const quoteForDigest = {
    ticker: stock.ticker,
    name: stock.name,
    price: stock.weekClose,
    change: stock.weekChange,
    changePercent: stock.weekChangePercent,
    volume: stock.weekVolume,
    marketCap: 0,
    previousClose: stock.weekOpen,
    dayHigh: stock.weekHigh,
    dayLow: stock.weekLow,
    fiftyTwoWeekHigh: stock.weekHigh,
    fiftyTwoWeekLow: stock.weekLow,
    per: null,
    pbr: null,
    eps: null,
    dividendYield: null,
    foreignRate: null,
  } as const

  return (
    <Card>
      {/* Stock Header */}
      <div
        className="border-b border-[var(--color-border-subtle)] p-4"
        style={{ borderTopWidth: 3, borderTopColor: color }}
      >
        <div className="flex items-center justify-between">
          <div>
            <Link
              href={`/stock/${stock.ticker}`}
              className="text-sm font-bold text-[var(--color-text-primary)] hover:underline"
            >
              {stock.name}
            </Link>
            <span className="ml-2 text-[10px] font-mono text-[var(--color-text-muted)]">
              {stock.ticker}
            </span>
          </div>
          <div className="text-right">
            <p className="text-base font-bold tabular-nums text-[var(--color-text-primary)]">
              {formatCurrency(stock.weekClose)}
            </p>
            <PriceChange
              change={stock.weekChange}
              changePercent={stock.weekChangePercent}
              className="text-xs"
            />
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-[var(--color-text-muted)]">주간 거래량</span>
          <span className="text-xs font-medium tabular-nums text-[var(--color-text-secondary)]">
            {formatVolume(stock.weekVolume)}
          </span>
          {/* Risk Alert Badges */}
          {analysis && analysis.riskAlerts.length > 0 && (
            <div className="ml-auto">
              <RiskAlertBadges alerts={analysis.riskAlerts} />
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6 p-4">
        {/* Weekly Summary */}
        {analysis?.weekSummary && (
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              주간 동향 요약
            </p>
            <p className="rounded-md bg-[var(--color-surface-50)] p-2.5 text-xs leading-relaxed text-[var(--color-text-secondary)]">
              {analysis.weekSummary}
            </p>
          </div>
        )}

        <hr className="border-[var(--color-border-subtle)]" />

        {/* Weekly Price Range */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            주간 가격 범위
          </p>
          <div className="space-y-1">
            <div className="relative h-2 rounded-full bg-[var(--color-surface-100)]">
              {(() => {
                const range = stock.weekHigh - stock.weekLow
                const closePos = range > 0 ? ((stock.weekClose - stock.weekLow) / range) * 100 : 50
                const isUp = stock.weekChangePercent >= 0
                return (
                  <>
                    <div
                      className="absolute inset-y-0 rounded-full opacity-30"
                      style={{
                        left: "0%",
                        right: "0%",
                        backgroundColor: isUp ? "var(--color-gain)" : "var(--color-loss)",
                      }}
                    />
                    <div
                      className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-white shadow"
                      style={{
                        left: `clamp(0.25rem, ${closePos}%, calc(100% - 0.5rem))`,
                        backgroundColor: isUp ? "var(--color-gain)" : "var(--color-loss)",
                      }}
                    />
                  </>
                )
              })()}
            </div>
            <div className="flex justify-between text-[10px] tabular-nums text-[var(--color-text-muted)]">
              <span>저 {formatCurrency(stock.weekLow)}</span>
              <span>종 {formatCurrency(stock.weekClose)}</span>
              <span>고 {formatCurrency(stock.weekHigh)}</span>
            </div>
          </div>
        </div>

        <hr className="border-[var(--color-border-subtle)]" />

        {/* Weekly Supply & Demand */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            주간 수급 동향
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-[var(--color-border-subtle)] p-2.5 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Users className="h-3 w-3 text-blue-500" />
                <span className="text-[10px] text-[var(--color-text-muted)]">외국인 순매수</span>
              </div>
              <p
                className="text-sm font-bold tabular-nums"
                style={{
                  color: stock.weekForeignNet > 0
                    ? "var(--color-gain)"
                    : stock.weekForeignNet < 0
                      ? "var(--color-loss)"
                      : "var(--color-text-muted)",
                }}
              >
                {stock.weekForeignNet > 0 ? "+" : ""}
                {formatNumber(stock.weekForeignNet)}
              </p>
            </div>
            <div className="rounded-lg border border-[var(--color-border-subtle)] p-2.5 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Building2 className="h-3 w-3 text-purple-500" />
                <span className="text-[10px] text-[var(--color-text-muted)]">기관 순매수</span>
              </div>
              <p
                className="text-sm font-bold tabular-nums"
                style={{
                  color: stock.weekInstitutionNet > 0
                    ? "var(--color-gain)"
                    : stock.weekInstitutionNet < 0
                      ? "var(--color-loss)"
                      : "var(--color-text-muted)",
                }}
              >
                {stock.weekInstitutionNet > 0 ? "+" : ""}
                {formatNumber(stock.weekInstitutionNet)}
              </p>
            </div>
          </div>
        </div>

        {/* Consensus Change */}
        {analysis?.consensusChange && (
          <>
            <hr className="border-[var(--color-border-subtle)]" />
            <ConsensusChangeCard change={analysis.consensusChange} />
          </>
        )}

        {/* Analyst Digest */}
        {analysis?.analystDigest && (
          <>
            <hr className="border-[var(--color-border-subtle)]" />
            <AnalystDigestSection digest={analysis.analystDigest} quote={quoteForDigest} />
          </>
        )}

        {/* Conviction Score */}
        {analysis?.conviction && (
          <>
            <hr className="border-[var(--color-border-subtle)]" />
            <ConvictionScoreCard conviction={analysis.conviction} stockName={stock.name} />
          </>
        )}

        {/* Action Item */}
        {analysis?.actionItem && (
          <>
            <hr className="border-[var(--color-border-subtle)]" />
            <ActionItemCard actionItem={analysis.actionItem} stockName={stock.name} />
          </>
        )}
      </div>
    </Card>
  )
}
