"use client"

import { useEffect, useState } from "react"
import { Clock, Newspaper } from "lucide-react"

interface NewsItem {
  readonly id: number
  readonly headline: string
  readonly source: string
  readonly url: string
  readonly datetime: number
}

export function USNewsFeed() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // AAPL 뉴스를 기본으로 (시총 1위 대표 뉴스)
    async function fetch_() {
      try {
        const res = await fetch("/api/us-stocks/AAPL/news")
        const json = await res.json()
        if (json.success) setNews(json.data)
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetch_()
  }, [])

  if (loading) {
    return (
      <div className="glass-card p-5">
        <div className="h-6 w-24 animate-pulse rounded bg-slate-100" />
        <div className="mt-3 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-slate-50" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <Newspaper className="h-4 w-4 text-amber-500" />
        <h2 className="text-sm font-semibold text-[var(--color-text-secondary)]">주요 뉴스</h2>
      </div>
      {news.length === 0 ? (
        <p className="py-4 text-center text-xs text-[var(--color-text-muted)]">
          뉴스를 불러올 수 없습니다.
        </p>
      ) : (
        <div className="space-y-2">
          {news.slice(0, 8).map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg px-2 py-2 transition-colors hover:bg-[var(--color-surface-50)]"
            >
              <p className="text-xs font-medium text-[var(--color-text-primary)] line-clamp-2">
                {item.headline}
              </p>
              <div className="mt-1 flex items-center gap-2 text-[10px] text-[var(--color-text-muted)]">
                <span>{item.source}</span>
                <span>·</span>
                <span className="flex items-center gap-0.5">
                  <Clock className="h-2.5 w-2.5" />
                  {formatRelative(item.datetime)}
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

function formatRelative(unixSeconds: number): string {
  const diff = Date.now() / 1000 - unixSeconds
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  return `${Math.floor(diff / 86400)}일 전`
}
