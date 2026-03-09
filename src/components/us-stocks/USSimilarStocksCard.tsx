"use client"

import { useState } from "react"
import { Dna, Loader2, Globe } from "lucide-react"
import Link from "next/link"

interface SimilarStock {
  ticker: string
  name: string
  market: "KR" | "US"
  similarity: number
  reason: string
  sector: string
}

interface SimilarData {
  dnaProfile: {
    growth: string
    value: string
    size: string
    style: string
  }
  similarStocks: SimilarStock[]
  crossMarketPeer: {
    ticker: string
    name: string
    market: "KR" | "US"
    reason: string
  }
  summary: string
}

interface Props {
  readonly ticker: string
  readonly name: string
  readonly sector?: string
  readonly per?: number | null
  readonly pbr?: number | null
  readonly marketCap?: number | null
  readonly dividendYield?: number | null
  readonly changePercent?: number
}

export function USSimilarStocksCard({ ticker, name, sector, per, pbr, marketCap, dividendYield, changePercent }: Props) {
  const [data, setData] = useState<SimilarData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const analyze = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/stocks/similar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker,
          name,
          market: "US",
          sector,
          per,
          pbr,
          marketCap,
          dividendYield,
          changePercent,
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

  const similarityColor = (s: number) => {
    if (s >= 80) return "text-emerald-500"
    if (s >= 60) return "text-blue-500"
    if (s >= 40) return "text-amber-500"
    return "text-slate-500"
  }

  return (
    <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Dna className="h-4 w-4 text-pink-500" />
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">유사 종목 DNA</h3>
        </div>
        {!data && (
          <button
            onClick={analyze}
            disabled={loading}
            className="rounded-lg bg-pink-500/10 px-3 py-1.5 text-xs font-medium text-pink-400 transition-colors hover:bg-pink-500/20 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "DNA 분석"}
          </button>
        )}
      </div>

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      {data && (
        <div className="mt-3 space-y-3">
          {/* DNA Profile */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: data.dnaProfile.growth, color: "bg-emerald-50 text-emerald-600" },
              { label: data.dnaProfile.value, color: "bg-blue-50 text-blue-600" },
              { label: data.dnaProfile.size, color: "bg-purple-50 text-purple-600" },
              { label: data.dnaProfile.style, color: "bg-amber-50 text-amber-600" },
            ].map((tag, i) => (
              <span key={i} className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${tag.color}`}>
                {tag.label}
              </span>
            ))}
          </div>

          {/* Similar stocks */}
          <div className="space-y-1.5">
            {data.similarStocks.slice(0, 5).map((s, i) => {
              const href = s.market === "US" ? `/us-stocks/${s.ticker}` : `/stock/${s.ticker}`
              return (
                <Link key={i} href={href} className="flex items-center gap-2 rounded-lg p-2 transition-colors hover:bg-[var(--color-surface-elevated)]">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-[var(--color-text-primary)]">{s.name}</span>
                      <span className="rounded px-1 py-0.5 text-[9px] font-medium bg-slate-100 text-slate-500">
                        {s.market === "US" ? s.ticker : s.ticker}
                      </span>
                      <span className="rounded px-1 py-0.5 text-[9px] font-medium bg-blue-50 text-blue-500">
                        {s.market}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-[var(--color-text-tertiary)]">{s.reason}</p>
                  </div>
                  <span className={`text-xs font-bold tabular-nums ${similarityColor(s.similarity)}`}>
                    {s.similarity}%
                  </span>
                </Link>
              )
            })}
          </div>

          {/* Cross market peer */}
          {data.crossMarketPeer && (
            <div className="flex items-center gap-2 rounded-lg bg-blue-500/5 border border-blue-500/20 p-2.5">
              <Globe className="h-3.5 w-3.5 text-blue-400" />
              <div className="text-[11px]">
                <span className="text-[var(--color-text-tertiary)]">글로벌 피어: </span>
                <span className="font-medium text-[var(--color-text-primary)]">{data.crossMarketPeer.name}</span>
                <span className="text-[var(--color-text-tertiary)]"> ({data.crossMarketPeer.market})</span>
                <p className="mt-0.5 text-[10px] text-[var(--color-text-tertiary)]">{data.crossMarketPeer.reason}</p>
              </div>
            </div>
          )}

          <p className="text-[10px] text-[var(--color-text-tertiary)]">{data.summary}</p>
        </div>
      )}
    </div>
  )
}
