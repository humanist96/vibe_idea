"use client"

import { Sparkles } from "lucide-react"

interface USExecutiveSummaryProps {
  readonly summary: string
  readonly date: string
}

export function USExecutiveSummary({ summary, date }: USExecutiveSummaryProps) {
  return (
    <div className="animate-fade-up rounded-xl bg-gradient-to-br from-blue-50/80 to-indigo-50/50 p-5">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-blue-500" />
        <h3 className="text-sm font-bold text-blue-900">Executive Summary</h3>
        <span className="ml-auto text-[10px] text-blue-400">{date}</span>
      </div>
      <p className="whitespace-pre-line text-sm leading-relaxed text-blue-900/80">
        {summary}
      </p>
    </div>
  )
}
