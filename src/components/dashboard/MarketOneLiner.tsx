"use client"

import { useEffect, useState } from "react"
import { Sparkles } from "lucide-react"

export function MarketOneLiner() {
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSummary() {
      try {
        const res = await fetch("/api/market/summary")
        const json = await res.json()
        if (json.success && json.data?.summary) {
          setSummary(json.data.summary)
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchSummary()
  }, [])

  if (loading) {
    return (
      <div className="glass-card animate-fade-up overflow-hidden p-4">
        <div className="skeleton-shimmer h-5 w-3/4 rounded" />
      </div>
    )
  }

  if (!summary) return null

  return (
    <div className="glass-card animate-fade-up overflow-hidden p-4">
      <div className="flex items-start gap-2.5">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--color-accent-300)] to-[var(--color-accent-500)] text-white">
          <Sparkles size={12} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-accent-500)]">
            AI 시장 요약
          </p>
          <p className="mt-0.5 text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {summary}
          </p>
        </div>
      </div>
    </div>
  )
}
