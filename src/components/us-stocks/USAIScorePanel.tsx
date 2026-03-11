"use client"

import { AIScorePanel } from "@/components/stock/AIScorePanel"

interface USAIScorePanelProps {
  readonly ticker: string
}

export function USAIScorePanel({ ticker }: USAIScorePanelProps) {
  return <AIScorePanel ticker={ticker} market="US" />
}
