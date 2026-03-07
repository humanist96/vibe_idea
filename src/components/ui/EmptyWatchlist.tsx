"use client"

import Link from "next/link"
import { BookmarkPlus, TrendingUp } from "lucide-react"
import { useMarketMode } from "@/store/market-mode"

interface EmptyWatchlistProps {
  readonly title?: string
  readonly description?: string
}

const KR_POPULAR = [
  { id: "005930", name: "삼성전자", href: "/stock/005930" },
  { id: "000660", name: "SK하이닉스", href: "/stock/000660" },
  { id: "373220", name: "LG에너지솔루션", href: "/stock/373220" },
  { id: "005380", name: "현대자동차", href: "/stock/005380" },
]

const US_POPULAR = [
  { id: "AAPL", name: "애플", href: "/us-stocks/AAPL" },
  { id: "NVDA", name: "엔비디아", href: "/us-stocks/NVDA" },
  { id: "MSFT", name: "마이크로소프트", href: "/us-stocks/MSFT" },
  { id: "TSLA", name: "테슬라", href: "/us-stocks/TSLA" },
]

export function EmptyWatchlist({
  title = "관심종목을 등록해주세요",
  description = "관심종목을 추가하면 실시간 현황과 분석을 확인할 수 있습니다.",
}: EmptyWatchlistProps) {
  const { mode } = useMarketMode()
  const isUS = mode === "us"
  const screenerHref = isUS ? "/us-stocks/screener" : "/screener"
  const popularStocks = isUS ? US_POPULAR : KR_POPULAR

  return (
    <div className="flex flex-col items-center py-12 animate-fade-up">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-surface-100)]">
        <BookmarkPlus className="h-7 w-7 text-[var(--color-text-muted)]" />
      </div>

      <h3 className="mb-1 text-sm font-semibold text-[var(--color-text-primary)]">
        {title}
      </h3>
      <p className="mb-6 max-w-xs text-center text-xs text-[var(--color-text-tertiary)]">
        {description}
      </p>

      <Link
        href={screenerHref}
        className="mb-6 inline-flex items-center gap-2 rounded-xl bg-[var(--color-accent-400)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--color-accent-500)]"
      >
        <BookmarkPlus size={14} />
        스크리너에서 종목 추가하기
      </Link>

      <div className="w-full max-w-xs">
        <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">
          인기 종목
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {popularStocks.map((stock) => (
            <Link
              key={stock.id}
              href={stock.href}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border-default)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-accent-400)] hover:text-[var(--color-accent-500)]"
            >
              <TrendingUp size={10} />
              {stock.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
