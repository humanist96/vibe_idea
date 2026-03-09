"use client"

import { useState } from "react"
import { BarChart3, Loader2, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils/cn"

interface EarningsPreview {
  keyPoints: string[]
  consensus: string
  surpriseProbability: string
  riskFactors: string[]
  expectedReaction: string
  summary: string
}

interface EarningsReview {
  verdict: "Beat" | "Meet" | "Miss"
  surpriseAnalysis: string
  keyTakeaways: string[]
  priceImpact: string
  outlook: string
  summary: string
}

type EarningsData = { mode: "preview" } & EarningsPreview | { mode: "review" } & EarningsReview

interface Props {
  readonly ticker: string
  readonly name: string
  readonly recentPrice?: number
  readonly changePercent?: number
  readonly sector?: string
  readonly earningsData?: {
    readonly actualEps?: number | null
    readonly estimatedEps?: number | null
    readonly actualRevenue?: number | null
    readonly estimatedRevenue?: number | null
    readonly surprisePercent?: number | null
    readonly reportDate?: string
  }
}

export function USEarningsPreviewCard({ ticker, name, recentPrice, changePercent, sector, earningsData }: Props) {
  const [data, setData] = useState<EarningsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const hasActuals = earningsData?.actualEps != null

  const analyze = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/earnings/ai-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker,
          name,
          recentPrice,
          changePercent,
          sector,
          earningsData,
          mode: hasActuals ? "review" : "preview",
        }),
      })
      const json = await res.json()
      if (json.success) setData(json.data)
      else setError(json.error || "분석 실패")
    } catch {
      setError("네트워크 오류")
    } finally {
      setLoading(false)
    }
  }

  const verdictColor = (v: string) => {
    if (v === "Beat") return "text-emerald-500 bg-emerald-50"
    if (v === "Miss") return "text-red-500 bg-red-50"
    return "text-amber-500 bg-amber-50"
  }

  return (
    <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-indigo-500" />
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
            실적 {hasActuals ? "리뷰" : "프리뷰"}
          </h3>
        </div>
        {!data && (
          <button
            onClick={analyze}
            disabled={loading}
            className="rounded-lg bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-400 transition-colors hover:bg-indigo-500/20 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "AI 분석"}
          </button>
        )}
      </div>

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      {data && data.mode === "preview" && (
        <div className="mt-3 space-y-3">
          <div className="space-y-1.5">
            <div className="text-[10px] font-medium text-[var(--color-text-tertiary)]">핵심 관전포인트</div>
            {(data as EarningsPreview & { mode: "preview" }).keyPoints.map((p, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px]">
                <TrendingUp className="mt-0.5 h-3 w-3 shrink-0 text-indigo-400" />
                <span className="text-[var(--color-text-secondary)]">{p}</span>
              </div>
            ))}
          </div>

          <div className="rounded-lg bg-[var(--color-surface-elevated)] p-2.5 text-[11px]">
            <span className="text-[var(--color-text-tertiary)]">컨센서스: </span>
            <span className="text-[var(--color-text-primary)]">{(data as EarningsPreview & { mode: "preview" }).consensus}</span>
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-[var(--color-text-tertiary)]">서프라이즈 확률:</span>
            <span className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-medium",
              (data as EarningsPreview & { mode: "preview" }).surpriseProbability === "높음" ? "bg-emerald-50 text-emerald-600" :
              (data as EarningsPreview & { mode: "preview" }).surpriseProbability === "낮음" ? "bg-red-50 text-red-600" :
              "bg-amber-50 text-amber-600"
            )}>
              {(data as EarningsPreview & { mode: "preview" }).surpriseProbability}
            </span>
          </div>

          {(data as EarningsPreview & { mode: "preview" }).riskFactors.length > 0 && (
            <div className="space-y-1">
              {(data as EarningsPreview & { mode: "preview" }).riskFactors.map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px]">
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-400" />
                  <span className="text-[var(--color-text-tertiary)]">{r}</span>
                </div>
              ))}
            </div>
          )}

          <p className="text-[10px] text-[var(--color-text-tertiary)]">{(data as EarningsPreview & { mode: "preview" }).summary}</p>
        </div>
      )}

      {data && data.mode === "review" && (
        <div className="mt-3 space-y-3">
          <div className="flex items-center gap-3">
            <span className={cn("rounded-md px-2.5 py-1 text-sm font-bold", verdictColor((data as EarningsReview & { mode: "review" }).verdict))}>
              {(data as EarningsReview & { mode: "review" }).verdict}
            </span>
            <span className="text-xs text-[var(--color-text-secondary)]">{(data as EarningsReview & { mode: "review" }).surpriseAnalysis}</span>
          </div>

          <div className="space-y-1.5">
            {(data as EarningsReview & { mode: "review" }).keyTakeaways.map((t, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px]">
                {(data as EarningsReview & { mode: "review" }).verdict === "Beat"
                  ? <TrendingUp className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
                  : <TrendingDown className="mt-0.5 h-3 w-3 shrink-0 text-red-400" />
                }
                <span className="text-[var(--color-text-secondary)]">{t}</span>
              </div>
            ))}
          </div>

          <div className="text-[11px]">
            <span className="text-[var(--color-text-tertiary)]">전망: </span>
            <span className="text-[var(--color-text-secondary)]">{(data as EarningsReview & { mode: "review" }).outlook}</span>
          </div>

          <p className="text-[10px] text-[var(--color-text-tertiary)]">{(data as EarningsReview & { mode: "review" }).summary}</p>
        </div>
      )}
    </div>
  )
}
