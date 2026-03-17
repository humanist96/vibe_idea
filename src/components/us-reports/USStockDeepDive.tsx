"use client"

import Link from "next/link"
import { Card } from "@/components/ui/Card"
import { PriceChange } from "@/components/ui/PriceChange"
import { RiskAlertBadges } from "@/components/reports/RiskAlertBadges"
import { ConvictionScoreCard } from "@/components/reports/ConvictionScoreCard"
import { ActionItemCard } from "@/components/reports/ActionItemCard"
import { USAnalystDigestSection } from "./USAnalystDigestSection"
import { Activity, Newspaper, Target } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import type {
  USStockReportData,
  USStockAnalysis,
} from "@/lib/report/us-types"
import type { TechnicalIndicators } from "@/lib/analysis/technical"

interface USStockDeepDiveProps {
  readonly stock: USStockReportData
  readonly analysis: USStockAnalysis | undefined
  readonly color: string
}

export function USStockDeepDive({
  stock,
  analysis,
  color,
}: USStockDeepDiveProps) {
  const q = stock.quote
  if (!q) return null

  return (
    <Card className="animate-fade-up">
      {/* Header */}
      <div
        className="border-b border-[var(--color-border-subtle)] p-4"
        style={{ borderTopWidth: 3, borderTopColor: color }}
      >
        <div className="flex items-center justify-between">
          <div>
            <Link
              href={`/us-stocks/${stock.symbol}`}
              className="text-sm font-bold text-[var(--color-text-primary)] hover:underline"
            >
              {stock.nameKr}
            </Link>
            <span className="ml-2 font-mono text-[10px] text-[var(--color-text-muted)]">
              {stock.symbol}
            </span>
            {stock.sectorKr && (
              <span className="ml-2 text-[10px] text-[var(--color-text-tertiary)]">
                · {stock.sectorKr}
              </span>
            )}
          </div>
          <div className="text-right">
            <p className="text-base font-bold tabular-nums text-[var(--color-text-primary)]">
              ${q.price.toFixed(2)}
            </p>
            <PriceChange
              change={q.change}
              changePercent={q.changePercent}
              className="text-xs"
            />
          </div>
        </div>
      </div>

      <div className="space-y-5 p-4">
        {/* Risk Alert Badges */}
        {analysis?.riskAlerts && analysis.riskAlerts.length > 0 && (
          <RiskAlertBadges alerts={analysis.riskAlerts} />
        )}

        {/* Mini Chart */}
        {stock.historical.length > 5 && (
          <MiniLineChart data={stock.historical} />
        )}

        {/* 52-Week Range */}
        {stock.metrics.fiftyTwoWeekHigh != null &&
          stock.metrics.fiftyTwoWeekLow != null && (
            <FiftyTwoWeekBar
              current={q.price}
              high={stock.metrics.fiftyTwoWeekHigh}
              low={stock.metrics.fiftyTwoWeekLow}
            />
          )}

        <hr className="border-[var(--color-border-subtle)]" />

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          <MetricCell
            label="PER"
            value={stock.metrics.pe ? `${stock.metrics.pe.toFixed(1)}x` : "-"}
          />
          <MetricCell
            label="PBR"
            value={
              stock.metrics.pb ? `${stock.metrics.pb.toFixed(2)}x` : "-"
            }
          />
          <MetricCell
            label="EPS"
            value={
              stock.metrics.eps ? `$${stock.metrics.eps.toFixed(2)}` : "-"
            }
          />
          <MetricCell
            label="배당률"
            value={
              stock.metrics.dividendYield
                ? `${stock.metrics.dividendYield.toFixed(2)}%`
                : "-"
            }
          />
          <MetricCell
            label="Beta"
            value={
              stock.metrics.beta ? stock.metrics.beta.toFixed(2) : "-"
            }
          />
          <MetricCell
            label="시총"
            value={
              stock.metrics.marketCap
                ? stock.metrics.marketCap >= 1000
                  ? `$${(stock.metrics.marketCap / 1000).toFixed(0)}B`
                  : `$${stock.metrics.marketCap.toFixed(0)}M`
                : "-"
            }
          />
        </div>

        {/* Conviction Score + Action Item */}
        {(analysis?.conviction || analysis?.actionItem) && (
          <>
            <hr className="border-[var(--color-border-subtle)]" />
            <div className="grid gap-4 md:grid-cols-2">
              {analysis.conviction && (
                <ConvictionScoreCard
                  conviction={analysis.conviction}
                  stockName={stock.nameKr}
                />
              )}
              {analysis.actionItem && (
                <ActionItemCard
                  actionItem={analysis.actionItem}
                  stockName={stock.nameKr}
                />
              )}
            </div>
          </>
        )}

        <hr className="border-[var(--color-border-subtle)]" />

        {/* Move Reasons */}
        <MoveReasonsSection analysis={analysis} />

        {/* Technical Analysis */}
        {stock.technical && (
          <>
            <hr className="border-[var(--color-border-subtle)]" />
            <TechnicalSection technical={stock.technical} />
          </>
        )}

        {/* Analyst Digest */}
        {analysis?.analystDigest && q && (
          <>
            <hr className="border-[var(--color-border-subtle)]" />
            <USAnalystDigestSection digest={analysis.analystDigest} quote={q} />
          </>
        )}

        {/* News */}
        {stock.news.length > 0 && (
          <>
            <hr className="border-[var(--color-border-subtle)]" />
            <NewsSection news={stock.news} />
          </>
        )}

        {/* Outlook */}
        {analysis?.outlook && (
          <>
            <hr className="border-[var(--color-border-subtle)]" />
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Target className="h-3.5 w-3.5 text-[var(--color-accent-500)]" />
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  전망
                </p>
              </div>
              <p className="rounded-lg bg-[var(--color-surface-50)] p-3 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                {analysis.outlook}
              </p>
            </div>
          </>
        )}
      </div>
    </Card>
  )
}

// ── Sub Components ──────────────────────────────────────

function MetricCell({
  label,
  value,
}: {
  readonly label: string
  readonly value: string
}) {
  return (
    <div>
      <p className="text-[10px] text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-0.5 font-mono text-xs font-semibold text-[var(--color-text-primary)]">
        {value}
      </p>
    </div>
  )
}

function MiniLineChart({
  data,
}: {
  readonly data: readonly { date: string; close: number }[]
}) {
  const prices = data.map((d) => d.close)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const range = max - min || 1
  const w = 600
  const h = 120
  const first = prices[0]
  const last = prices[prices.length - 1]
  const isPositive = last >= first

  const points = prices
    .map((p, i) => {
      const x = (i / (prices.length - 1)) * w
      const y = h - ((p - min) / range) * (h - 16) - 8
      return `${x},${y}`
    })
    .join(" ")

  const fillPoints = `0,${h} ${points} ${w},${h}`
  const gradId = `us-rpt-${isPositive ? "up" : "dn"}-${data[0]?.date ?? ""}`

  return (
    <div>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        가격 추이 ({data.length}일)
      </p>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
            <stop
              offset="0%"
              stopColor={isPositive ? "#10b981" : "#ef4444"}
              stopOpacity="0.15"
            />
            <stop
              offset="100%"
              stopColor={isPositive ? "#10b981" : "#ef4444"}
              stopOpacity="0"
            />
          </linearGradient>
        </defs>
        <polygon points={fillPoints} fill={`url(#${gradId})`} />
        <polyline
          points={points}
          fill="none"
          stroke={isPositive ? "#10b981" : "#ef4444"}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      <div className="mt-1 flex justify-between text-[9px] text-[var(--color-text-muted)]">
        <span>{data[0].date}</span>
        <span>{data[data.length - 1].date}</span>
      </div>
    </div>
  )
}

function FiftyTwoWeekBar({
  current,
  high,
  low,
}: {
  readonly current: number
  readonly high: number
  readonly low: number
}) {
  const range = high - low || 1
  const pct = Math.max(0, Math.min(100, ((current - low) / range) * 100))

  return (
    <div>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        52주 범위
      </p>
      <div className="flex items-center gap-2">
        <span className="text-[10px] tabular-nums text-[var(--color-text-muted)]">
          ${low.toFixed(0)}
        </span>
        <div className="relative flex-1 h-2 rounded-full bg-[var(--color-surface-100)]">
          <div
            className="absolute h-full rounded-full bg-gradient-to-r from-[var(--color-loss)] via-[var(--color-accent-400)] to-[var(--color-gain)]"
            style={{ width: `${pct}%` }}
          />
          <div
            className="absolute top-1/2 h-3.5 w-1 -translate-y-1/2 rounded-full bg-[var(--color-text-primary)]"
            style={{ left: `${pct}%` }}
          />
        </div>
        <span className="text-[10px] tabular-nums text-[var(--color-text-muted)]">
          ${high.toFixed(0)}
        </span>
      </div>
    </div>
  )
}

const CATEGORY_LABELS: Record<string, string> = {
  valuation: "밸류에이션",
  momentum: "모멘텀",
  news: "뉴스",
  technical: "기술적",
  earnings: "실적",
  macro: "매크로",
}

function MoveReasonsSection({
  analysis,
}: {
  readonly analysis: USStockAnalysis | undefined
}) {
  const reasons = analysis?.moveReasons ?? []

  return (
    <div>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        등락 요인 분석
      </p>
      {reasons.length === 0 ? (
        <p className="text-xs text-[var(--color-text-tertiary)]">
          분석 데이터가 부족합니다.
        </p>
      ) : (
        <div className="space-y-2">
          {reasons.map((r) => (
            <div
              key={r.rank}
              className={cn(
                "rounded-lg border-l-[3px] bg-[var(--color-surface-50)] p-3",
                r.impact === "positive"
                  ? "border-l-emerald-500"
                  : "border-l-red-500"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-[var(--color-text-tertiary)]">
                  #{r.rank}{" "}
                  {CATEGORY_LABELS[r.category] ?? r.category}
                </span>
                <span
                  className={cn(
                    "ml-auto rounded-full px-1.5 py-0.5 text-[9px] font-bold",
                    r.impact === "positive"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-700"
                  )}
                >
                  {r.impact === "positive" ? "호재" : "악재"}
                </span>
              </div>
              <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                {r.description}
              </p>
              <p className="mt-0.5 text-[10px] text-[var(--color-text-muted)]">
                근거: {r.evidence}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TechnicalSection({
  technical,
}: {
  readonly technical: TechnicalIndicators
}) {
  const rsi = technical.rsi
  const angleRad = Math.PI * (1 - rsi / 100)
  const needleX = 50 + 30 * Math.cos(angleRad)
  const needleY = 55 - 30 * Math.sin(angleRad)

  const signals = [
    {
      name: "RSI(14)",
      value: rsi.toFixed(1),
      signal: rsi > 70 ? "매도" : rsi < 30 ? "매수" : "중립",
    },
    {
      name: "MACD",
      value: technical.macdHistogram.toFixed(3),
      signal: technical.macdHistogram > 0 ? "매수" : "매도",
    },
    {
      name: "SMA20",
      value: `${technical.priceVsSma20 > 0 ? "+" : ""}${technical.priceVsSma20.toFixed(1)}%`,
      signal: technical.priceVsSma20 > 0 ? "매수" : "매도",
    },
    {
      name: "SMA50",
      value: `${technical.priceVsSma50 > 0 ? "+" : ""}${technical.priceVsSma50.toFixed(1)}%`,
      signal: technical.priceVsSma50 > 0 ? "매수" : "매도",
    },
    {
      name: "SMA200",
      value: `${technical.priceVsSma200 > 0 ? "+" : ""}${technical.priceVsSma200.toFixed(1)}%`,
      signal: technical.priceVsSma200 > 0 ? "매수" : "매도",
    },
  ] as const

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Activity className="h-3.5 w-3.5 text-[var(--color-accent-500)]" />
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          기술적 분석
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        {/* RSI Gauge */}
        <div className="flex flex-col items-center">
          <svg width="100" height="60" viewBox="0 0 100 60">
            <path
              d="M 10 55 A 40 40 0 0 1 90 55"
              fill="none"
              stroke="var(--color-surface-100)"
              strokeWidth="6"
            />
            <path
              d="M 10 55 A 40 40 0 0 1 90 55"
              fill="none"
              stroke={
                rsi > 70 ? "#ef4444" : rsi < 30 ? "#10b981" : "#f59e0b"
              }
              strokeWidth="6"
              strokeDasharray={`${(rsi / 100) * 125.6} 125.6`}
            />
            <line
              x1="50"
              y1="55"
              x2={needleX}
              y2={needleY}
              stroke="var(--color-text-primary)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <text
              x="50"
              y="52"
              textAnchor="middle"
              fontSize="12"
              fontWeight="bold"
              fill="var(--color-text-primary)"
            >
              {rsi.toFixed(0)}
            </text>
          </svg>
          <p className="text-[10px] text-[var(--color-text-muted)]">
            RSI(14)
          </p>
        </div>

        {/* MACD Values */}
        <div className="flex-1">
          <p className="mb-1 text-[10px] text-[var(--color-text-muted)]">
            MACD 지표
          </p>
          <div className="flex w-full items-center justify-around text-[10px]">
            <div className="text-center">
              <p className="text-[var(--color-text-muted)]">MACD</p>
              <p
                className={cn(
                  "font-mono font-bold",
                  technical.macdLine > 0
                    ? "text-[var(--color-gain)]"
                    : "text-[var(--color-loss)]"
                )}
              >
                {technical.macdLine.toFixed(3)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[var(--color-text-muted)]">Signal</p>
              <p className="font-mono font-bold text-[var(--color-text-secondary)]">
                {technical.macdSignal.toFixed(3)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[var(--color-text-muted)]">Histogram</p>
              <p
                className={cn(
                  "font-mono font-bold",
                  technical.macdHistogram > 0
                    ? "text-[var(--color-gain)]"
                    : "text-[var(--color-loss)]"
                )}
              >
                {technical.macdHistogram > 0 ? "+" : ""}
                {technical.macdHistogram.toFixed(3)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Signal Summary Table */}
      <table className="mt-3 w-full text-[11px]">
        <tbody>
          {signals.map((s) => (
            <tr
              key={s.name}
              className="border-b border-[var(--color-border-subtle)] last:border-0"
            >
              <td className="py-1 text-[var(--color-text-secondary)]">
                {s.name}
              </td>
              <td className="py-1 text-right tabular-nums font-medium text-[var(--color-text-primary)]">
                {s.value}
              </td>
              <td className="py-1 text-right">
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[9px] font-bold",
                    s.signal === "매수"
                      ? "bg-emerald-50 text-emerald-700"
                      : s.signal === "매도"
                        ? "bg-red-50 text-red-700"
                        : "bg-slate-100 text-slate-600"
                  )}
                >
                  {s.signal}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function NewsSection({
  news,
}: {
  readonly news: readonly {
    headline: string
    source: string
    datetime: number
    url: string
  }[]
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <Newspaper className="h-3.5 w-3.5 text-[var(--color-accent-500)]" />
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          최근 뉴스
        </p>
      </div>
      <div className="space-y-1.5">
        {news.map((n, i) => (
          <a
            key={i}
            href={n.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-lg p-2 text-xs transition-colors hover:bg-[var(--color-surface-50)]"
          >
            <p className="text-[var(--color-text-primary)] line-clamp-1">
              {n.headline}
            </p>
            <p className="mt-0.5 text-[10px] text-[var(--color-text-muted)]">
              {n.source} ·{" "}
              {new Date(n.datetime * 1000).toLocaleDateString("ko-KR")}
            </p>
          </a>
        ))}
      </div>
    </div>
  )
}
