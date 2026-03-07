"use client"

import { Sparkles } from "lucide-react"

interface ExecutiveSummaryProps {
  readonly summary: string
  readonly date: string
}

export function ExecutiveSummary({ summary, date }: ExecutiveSummaryProps) {
  return (
    <div className="glass-card rounded-xl border border-amber-200/50 bg-gradient-to-r from-amber-50/80 to-orange-50/50 p-5">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-amber-500" />
        <h2 className="text-sm font-bold text-amber-700">Executive Summary</h2>
        <span className="ml-auto text-[10px] text-[var(--color-text-muted)]">{date}</span>
      </div>
      <p className="text-sm leading-relaxed text-[var(--color-text-primary)]">{summary}</p>
    </div>
  )
}
