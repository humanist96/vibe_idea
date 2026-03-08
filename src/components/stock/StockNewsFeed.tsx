"use client"

import { useState, useEffect } from "react"
import { Newspaper, ExternalLink, Loader2 } from "lucide-react"

interface NewsItem {
  readonly title: string
  readonly source: string
  readonly url: string
  readonly publishedAt: string
  readonly snippet?: string
}

interface Props {
  readonly ticker: string
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 60) return `${diffMin}분 전`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}시간 전`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay}일 전`
  return new Date(dateStr).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  })
}

export function StockNewsFeed({ ticker }: Props) {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchNews() {
      try {
        const res = await fetch(`/api/stocks/${ticker}/news`)
        const json = await res.json()
        if (json.success) {
          setNews(json.data)
        }
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    fetchNews()
  }, [ticker])

  if (loading) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-card)] p-4">
        <div className="flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
            관련 뉴스
          </h3>
        </div>
        <div className="mt-4 flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--color-text-tertiary)]" />
        </div>
      </div>
    )
  }

  if (news.length === 0) return null

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-card)] p-4">
      <div className="flex items-center gap-2">
        <Newspaper className="h-4 w-4 text-blue-400" />
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
          관련 뉴스
        </h3>
        <span className="ml-auto text-[10px] text-[var(--color-text-tertiary)]">
          {news.length}건
        </span>
      </div>

      <div className="mt-3 divide-y divide-[var(--color-border)]">
        {news.map((item, i) => (
          <a
            key={i}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-3 py-3 first:pt-0 last:pb-0 transition-colors hover:bg-[var(--color-surface-elevated)] -mx-2 px-2 rounded-lg"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--color-text-primary)] line-clamp-2 group-hover:text-blue-400 transition-colors">
                {item.title}
              </p>
              {item.snippet && (
                <p className="mt-1 text-xs text-[var(--color-text-tertiary)] line-clamp-1">
                  {item.snippet}
                </p>
              )}
              <div className="mt-1 flex items-center gap-2 text-[10px] text-[var(--color-text-tertiary)]">
                <span>{item.source}</span>
                <span>·</span>
                <span>{formatRelativeTime(item.publishedAt)}</span>
              </div>
            </div>
            <ExternalLink className="mt-1 h-3.5 w-3.5 flex-shrink-0 text-[var(--color-text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        ))}
      </div>
    </div>
  )
}
