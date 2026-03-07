"use client"

import { Newspaper } from "lucide-react"
import { SentimentDonut } from "./charts/SentimentDonut"
import type { NewsArticle, NewsSentiment } from "@/lib/api/news-types"
import type { CorporateEvent } from "@/lib/api/dart-events-types"

interface NewsSentimentSectionProps {
  readonly news: readonly NewsArticle[]
  readonly sentiment: NewsSentiment | null
  readonly events: readonly CorporateEvent[]
}

export function NewsSentimentSection({ news, sentiment, events }: NewsSentimentSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Newspaper className="h-3.5 w-3.5 text-purple-500" />
        <h4 className="text-xs font-bold text-[var(--color-text-primary)]">뉴스 & 이벤트</h4>
      </div>

      {sentiment && <SentimentDonut sentiment={sentiment} />}

      {news.length > 0 && (
        <div className="space-y-1.5">
          {news.slice(0, 5).map((article, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[var(--color-text-muted)]" />
              <div className="min-w-0 flex-1">
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[var(--color-text-primary)] hover:underline"
                >
                  {article.title}
                </a>
                <span className="ml-1 text-[10px] text-[var(--color-text-muted)]">
                  {article.source} · {article.publishedAt}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {events.length > 0 && (
        <div className="mt-2 space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">공시</p>
          {events.slice(0, 3).map((event) => (
            <div key={event.id} className="flex items-start gap-2 text-xs">
              <span className="shrink-0 rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-medium text-blue-600">
                {event.category}
              </span>
              <span className="text-[var(--color-text-secondary)]">{event.reportName}</span>
              <span className="ml-auto shrink-0 text-[10px] text-[var(--color-text-muted)]">{event.date}</span>
            </div>
          ))}
        </div>
      )}

      {news.length === 0 && events.length === 0 && (
        <p className="text-xs text-[var(--color-text-muted)]">관련 뉴스 및 공시 없음</p>
      )}
    </div>
  )
}
