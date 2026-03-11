"use client"

import { BookOpen, TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight } from "lucide-react"
import type { AnalystDigest } from "@/lib/report/types"
import type { StockQuote } from "@/lib/api/naver-finance"

interface AnalystDigestSectionProps {
  readonly digest: AnalystDigest
  readonly quote: StockQuote
}

const TREND_ICONS = {
  "상향": TrendingUp,
  "하향": TrendingDown,
  "유지": Minus,
}

const TREND_COLORS = {
  "상향": "text-green-600",
  "하향": "text-red-600",
  "유지": "text-gray-500",
}

export function AnalystDigestSection({ digest, quote }: AnalystDigestSectionProps) {
  const TrendIcon = digest.opinionTrend ? TREND_ICONS[digest.opinionTrend as keyof typeof TREND_ICONS] : null
  const trendColor = digest.opinionTrend ? TREND_COLORS[digest.opinionTrend as keyof typeof TREND_COLORS] : ""

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <BookOpen className="h-3.5 w-3.5 text-orange-500" />
        <h4 className="text-xs font-bold text-[var(--color-text-primary)]">애널리스트 리포트 다이제스트</h4>
        {digest.opinionTrend && TrendIcon && (
          <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium ${trendColor}`}>
            <TrendIcon className="h-3 w-3" />
            목표가 {digest.opinionTrend}
          </span>
        )}
      </div>

      {/* AI Summary */}
      <p className="text-xs leading-relaxed text-[var(--color-text-secondary)] bg-[var(--color-surface-50)] rounded-md p-2.5">
        {digest.summary}
      </p>

      {/* Target Price Gap */}
      {digest.targetPriceUpside !== null && (
        <div className="flex items-center gap-3 rounded-lg border border-[var(--color-border-subtle)] p-2.5">
          <div className="text-center">
            <p className="text-[10px] text-[var(--color-text-muted)]">괴리율</p>
            <p className={`text-sm font-bold tabular-nums ${digest.targetPriceUpside >= 0 ? "text-green-600" : "text-red-600"}`}>
              {digest.targetPriceUpside >= 0 ? "+" : ""}{digest.targetPriceUpside}%
            </p>
          </div>
          <div className="flex-1 text-center">
            <p className="text-[10px] text-[var(--color-text-muted)]">현재가</p>
            <p className="text-xs font-semibold tabular-nums text-[var(--color-text-primary)]">
              {quote.price.toLocaleString("ko-KR")}원
            </p>
          </div>
          <div className="flex items-center gap-1 text-center">
            {digest.targetPriceUpside >= 0 ? (
              <ArrowUpRight className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />
            )}
          </div>
          <div className="text-center">
            <p className="text-[10px] text-[var(--color-text-muted)]">목표가</p>
            <p className="text-xs font-semibold tabular-nums text-[var(--color-text-primary)]">
              {digest.recentReports[0]?.targetPrice
                ? digest.recentReports[0].targetPrice.toLocaleString("ko-KR") + "원"
                : "-"}
            </p>
          </div>
        </div>
      )}

      {/* Recent Reports */}
      {digest.recentReports.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
            최근 리포트
          </p>
          <div className="space-y-0.5">
            {digest.recentReports.map((report, i) => (
              <div
                key={i}
                className="flex items-center gap-2 py-1 text-[11px] border-b border-[var(--color-border-subtle)] last:border-0"
              >
                <span className="shrink-0 rounded bg-[var(--color-surface-100)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-text-muted)]">
                  {report.provider}
                </span>
                <span className="flex-1 truncate text-[var(--color-text-secondary)]">
                  {report.title}
                </span>
                {report.targetPrice && (
                  <span className="shrink-0 tabular-nums font-medium text-[var(--color-text-primary)]">
                    {report.targetPrice.toLocaleString("ko-KR")}원
                  </span>
                )}
                <span className="shrink-0 text-[10px] text-[var(--color-text-muted)]">
                  {report.date}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
