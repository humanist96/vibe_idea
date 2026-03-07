"use client"

import { useState, useCallback } from "react"
import { Card } from "@/components/ui/Card"
import { BookOpen, Loader2, Lightbulb } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import type { PortfolioItem } from "@/store/portfolio"
import type { QuoteResult } from "@/app/api/user/portfolio/quotes/route"

interface JournalEntry {
  readonly title: string
  readonly emoji: string
  readonly marketSummary: string
  readonly portfolioSummary: string
  readonly topMover: {
    readonly name: string
    readonly ticker: string
    readonly changePercent: number
    readonly reason: string
  }
  readonly lesson: string
  readonly mood: "great" | "good" | "neutral" | "bad" | "terrible"
  readonly fullEntry: string
}

interface InvestmentJournalCardProps {
  readonly items: readonly PortfolioItem[]
  readonly quotes: Record<string, QuoteResult>
}

const MOOD_COLORS: Record<string, string> = {
  great: "bg-emerald-50 text-emerald-700 ring-emerald-200/60",
  good: "bg-green-50 text-green-700 ring-green-200/60",
  neutral: "bg-slate-50 text-slate-600 ring-slate-200/60",
  bad: "bg-orange-50 text-orange-700 ring-orange-200/60",
  terrible: "bg-red-50 text-red-700 ring-red-200/60",
}

const MOOD_LABELS: Record<string, string> = {
  great: "최고의 하루",
  good: "좋은 하루",
  neutral: "평범한 하루",
  bad: "아쉬운 하루",
  terrible: "힘든 하루",
}

export function InvestmentJournalCard({ items, quotes }: InvestmentJournalCardProps) {
  const [entry, setEntry] = useState<JournalEntry | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const generateJournal = useCallback(async () => {
    if (items.length === 0) return
    setLoading(true)
    setError("")

    try {
      const portfolio = items.map((item) => {
        const quote = quotes[item.ticker]
        const currentPrice = quote?.price ?? item.avgPrice
        const pnlPercent = item.avgPrice > 0
          ? ((currentPrice - item.avgPrice) / item.avgPrice) * 100
          : 0
        return {
          name: item.name,
          ticker: item.ticker,
          changePercent: quote?.changePercent ?? 0,
          pnlPercent,
        }
      })

      const today = new Date().toISOString().split("T")[0]

      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portfolio, date: today }),
      })
      const json = await res.json()

      if (json.success) {
        setEntry(json.data)
      } else {
        setError(json.error ?? "일기 생성에 실패했습니다.")
      }
    } catch {
      setError("요청 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }, [items, quotes])

  if (items.length === 0) return null

  return (
    <Card>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 shadow-sm">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">AI 투자 일기</h3>
              <p className="text-[10px] text-[var(--color-text-muted)]">오늘의 투자 성과를 AI가 기록합니다</p>
            </div>
          </div>
          <button
            type="button"
            onClick={generateJournal}
            disabled={loading}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200",
              "bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-sm",
              "hover:from-indigo-600 hover:to-blue-700",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <BookOpen className="h-3.5 w-3.5" />
            )}
            {entry ? "다시 쓰기" : "일기 작성"}
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 ring-1 ring-red-200/60">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-[var(--color-text-muted)]">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
            AI가 오늘의 일기를 작성하고 있습니다...
          </div>
        )}

        {entry && !loading && (
          <div className="space-y-3">
            {/* Title + Mood */}
            <div className="flex items-center gap-2">
              <span className="text-2xl">{entry.emoji}</span>
              <h4 className="text-base font-bold text-[var(--color-text-primary)]">{entry.title}</h4>
              <span className={cn(
                "ml-auto rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1",
                MOOD_COLORS[entry.mood] ?? MOOD_COLORS.neutral
              )}>
                {MOOD_LABELS[entry.mood] ?? "보통"}
              </span>
            </div>

            {/* Full Entry */}
            <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {entry.fullEntry}
            </p>

            {/* Top Mover */}
            <div className="rounded-lg bg-slate-50/80 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-1">
                오늘의 주인공
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {entry.topMover.name}
                </span>
                <span className={cn(
                  "text-sm font-bold tabular-nums",
                  entry.topMover.changePercent >= 0 ? "text-emerald-600" : "text-red-600"
                )}>
                  {entry.topMover.changePercent >= 0 ? "+" : ""}{entry.topMover.changePercent.toFixed(1)}%
                </span>
              </div>
              <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">{entry.topMover.reason}</p>
            </div>

            {/* Lesson */}
            <div className="flex items-start gap-2 rounded-lg bg-amber-50/80 px-3 py-2 ring-1 ring-amber-200/40">
              <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
              <p className="text-xs font-medium text-amber-800">{entry.lesson}</p>
            </div>
          </div>
        )}

        {!entry && !loading && !error && (
          <div className="py-4 text-center text-xs text-[var(--color-text-muted)]">
            &lsquo;일기 작성&rsquo; 버튼을 눌러 오늘의 투자 일기를 만들어보세요
          </div>
        )}
      </div>
    </Card>
  )
}
