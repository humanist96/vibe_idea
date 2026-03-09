"use client"

import { useState } from "react"
import { Calculator, TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react"

interface FairValueData {
  fairValue: {
    dcf: { price: number; upside: number; assumptions: string }
    perBased: { price: number; upside: number; peerAvgPer: number; assumptions: string }
    pbrBased: { price: number; upside: number; peerAvgPbr: number; assumptions: string }
  }
  consensus: { bear: number; base: number; bull: number }
  verdict: string
  confidence: string
  keyDrivers: string[]
  risks: string[]
  summary: string
}

interface Props {
  ticker: string
  name: string
  currentPrice: number
  per?: number | null
  pbr?: number | null
  eps?: number | null
  bps?: number | null
  dividendYield?: number | null
  marketCap?: number
  sector?: string
  revenue?: number | null
  netIncome?: number | null
}

export function FairValueCard(props: Props) {
  const [data, setData] = useState<FairValueData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const analyze = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/stocks/fair-value", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(props),
      })
      const json = await res.json()
      if (json.success) {
        setData(json.data)
      } else {
        setError(json.error || "분석 실패")
      }
    } catch {
      setError("네트워크 오류")
    } finally {
      setLoading(false)
    }
  }

  const verdictColor = (v: string) => {
    if (v === "저평가") return "text-emerald-400"
    if (v === "고평가") return "text-red-400"
    return "text-amber-400"
  }

  const upsideIcon = (u: number) => {
    if (u > 5) return <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
    if (u < -5) return <TrendingDown className="h-3.5 w-3.5 text-red-400" />
    return <Minus className="h-3.5 w-3.5 text-gray-400" />
  }

  return (
    <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">AI 적정주가</h3>
        </div>
        {!data && (
          <button
            onClick={analyze}
            disabled={loading}
            className="rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/20 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "분석하기"}
          </button>
        )}
      </div>

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      {data && (
        <div className="mt-3 space-y-3">
          {/* Verdict */}
          <div className="flex items-center justify-between rounded-lg bg-[var(--color-surface-elevated)] p-3">
            <div>
              <span className={`text-lg font-bold ${verdictColor(data.verdict)}`}>{data.verdict}</span>
              <span className="ml-2 text-xs text-[var(--color-text-tertiary)]">신뢰도: {data.confidence}</span>
            </div>
            <div className="text-right">
              <div className="text-xs text-[var(--color-text-tertiary)]">기준가 (Base)</div>
              <div className="text-sm font-bold text-[var(--color-text-primary)]">{data.consensus.base.toLocaleString()}원</div>
            </div>
          </div>

          {/* Three methods */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "DCF", val: data.fairValue.dcf },
              { label: "PER 기반", val: data.fairValue.perBased },
              { label: "PBR 기반", val: data.fairValue.pbrBased },
            ].map((m) => (
              <div key={m.label} className="rounded-lg bg-[var(--color-surface-elevated)] p-2 text-center">
                <div className="text-[10px] text-[var(--color-text-tertiary)]">{m.label}</div>
                <div className="text-sm font-semibold text-[var(--color-text-primary)]">{m.val.price.toLocaleString()}</div>
                <div className="flex items-center justify-center gap-1">
                  {upsideIcon(m.val.upside)}
                  <span className={`text-[10px] ${m.val.upside > 0 ? "text-emerald-400" : m.val.upside < 0 ? "text-red-400" : "text-gray-400"}`}>
                    {m.val.upside > 0 ? "+" : ""}{m.val.upside}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Consensus range */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-red-400">{data.consensus.bear.toLocaleString()}</span>
            <div className="relative flex-1 h-1.5 rounded-full bg-[var(--color-surface-elevated)]">
              <div
                className="absolute h-full rounded-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500"
                style={{ width: "100%" }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 h-3 w-0.5 bg-white"
                style={{
                  left: `${Math.min(100, Math.max(0, ((props.currentPrice - data.consensus.bear) / (data.consensus.bull - data.consensus.bear)) * 100))}%`,
                }}
              />
            </div>
            <span className="text-emerald-400">{data.consensus.bull.toLocaleString()}</span>
          </div>

          {/* Key drivers & risks */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <div className="mb-1 font-medium text-emerald-400">핵심 드라이버</div>
              {data.keyDrivers.map((d, i) => (
                <div key={i} className="text-[var(--color-text-secondary)]">• {d}</div>
              ))}
            </div>
            <div>
              <div className="mb-1 font-medium text-red-400">리스크</div>
              {data.risks.map((r, i) => (
                <div key={i} className="text-[var(--color-text-secondary)]">• {r}</div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-[var(--color-text-tertiary)]">{data.summary}</p>
        </div>
      )}
    </div>
  )
}
