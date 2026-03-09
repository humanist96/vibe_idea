"use client"

import { useState } from "react"
import Link from "next/link"
import { FileText } from "lucide-react"
import { formatDate } from "@/lib/utils/format"
import { useRecentlyViewedStore } from "@/store/recently-viewed"

type Tab = "KR" | "US"

export function ReportArchiveCard() {
  const [tab, setTab] = useState<Tab>("KR")
  const recentlyViewed = useRecentlyViewedStore((s) => s.stocks)

  const recentForTab = recentlyViewed
    .filter((s) => {
      if (tab === "KR") return !s.ticker.match(/^[A-Z]/)
      return s.ticker.match(/^[A-Z]/)
    })
    .slice(0, 5)

  return (
    <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-amber-500" />
          <h3 className="text-sm font-bold text-[var(--color-text-primary)]">보고서 아카이브</h3>
        </div>

        <div className="flex rounded-xl bg-[var(--color-surface-100)] p-1">
          <button
            type="button"
            onClick={() => setTab("KR")}
            className={`rounded-lg px-3 py-2 text-xs font-medium transition-all ${
              tab === "KR"
                ? "bg-white text-[var(--color-text-primary)] shadow-sm"
                : "text-[var(--color-text-muted)]"
            }`}
          >
            국내
          </button>
          <button
            type="button"
            onClick={() => setTab("US")}
            className={`rounded-lg px-3 py-2 text-xs font-medium transition-all ${
              tab === "US"
                ? "bg-white text-[var(--color-text-primary)] shadow-sm"
                : "text-[var(--color-text-muted)]"
            }`}
          >
            해외
          </button>
        </div>
      </div>

      {recentForTab.length === 0 ? (
        <p className="py-4 text-center text-xs text-[var(--color-text-muted)]">
          최근 조회한 {tab === "KR" ? "국내" : "해외"} 종목이 없습니다.
        </p>
      ) : (
        <div className="space-y-1">
          {recentForTab.map((stock) => {
            const href =
              tab === "KR"
                ? `/stock/${stock.ticker}`
                : `/us-stocks/${stock.ticker}`

            return (
              <Link
                key={stock.ticker}
                href={href}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-[var(--color-surface-50)] transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-sm text-[var(--color-text-primary)]">{stock.name}</span>
                  <span className="ml-2 text-xs text-[var(--color-text-muted)]">
                    {stock.ticker}
                  </span>
                </div>
                <span className="ml-2 shrink-0 text-xs text-[var(--color-text-muted)]">
                  {formatDate(new Date(stock.viewedAt))}
                </span>
              </Link>
            )
          })}
        </div>
      )}

      <div className="mt-4 text-center">
        <Link
          href={tab === "KR" ? "/reports" : "/us-stocks/reports"}
          className="inline-block rounded-xl px-4 py-2.5 text-xs font-medium text-amber-500 hover:bg-amber-50 hover:text-amber-600 transition-colors"
        >
          전체 보고서 보기 →
        </Link>
      </div>
    </div>
  )
}
