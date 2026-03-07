"use client"

import { useState } from "react"
import { Crosshair, Loader2, ShieldAlert, Target } from "lucide-react"

interface EntryExitData {
  signal: string
  confidence: number
  timing: {
    entry: { idealPrice: number; supportLevels: number[]; strategy: string }
    exit: { targetPrice: number; resistanceLevels: number[]; stopLoss: number; strategy: string }
  }
  technicalView: { trend: string; momentum: string; volumeSignal: string; comment: string }
  positionSizing: { recommendedWeight: string; splitStrategy: string }
  risks: string[]
  summary: string
}

interface Props {
  ticker: string
  name: string
  currentPrice: number
  high52w?: number
  low52w?: number
  per?: number | null
  pbr?: number | null
  rsi?: number | null
  volume?: number
  avgVolume?: number
  changePercent?: number
  avgPrice?: number
  holdingShares?: number
}

export function EntryExitCoachCard(props: Props) {
  const [data, setData] = useState<EntryExitData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const analyze = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/stocks/entry-exit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(props),
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

  const signalColor = (s: string) => {
    if (s.includes("매수")) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
    if (s.includes("매도") || s.includes("축소")) return "bg-red-500/10 text-red-400 border-red-500/30"
    return "bg-amber-500/10 text-amber-400 border-amber-500/30"
  }

  const trendBadge = (t: string) => {
    if (t === "상승") return "text-emerald-400"
    if (t === "하락") return "text-red-400"
    return "text-amber-400"
  }

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-card)] p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crosshair className="h-4 w-4 text-violet-400" />
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">매매 타이밍 코치</h3>
        </div>
        {!data && (
          <button
            onClick={analyze}
            disabled={loading}
            className="rounded-lg bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-400 transition-colors hover:bg-violet-500/20 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "코칭 받기"}
          </button>
        )}
      </div>

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      {data && (
        <div className="mt-3 space-y-3">
          {/* Signal + Confidence */}
          <div className="flex items-center gap-3">
            <span className={`rounded-full border px-3 py-1 text-sm font-bold ${signalColor(data.signal)}`}>
              {data.signal}
            </span>
            <div className="flex-1">
              <div className="flex items-center justify-between text-[10px] text-[var(--color-text-tertiary)]">
                <span>확신도</span>
                <span>{data.confidence}%</span>
              </div>
              <div className="mt-0.5 h-1.5 rounded-full bg-[var(--color-surface-elevated)]">
                <div
                  className="h-full rounded-full bg-violet-500 transition-all"
                  style={{ width: `${data.confidence}%` }}
                />
              </div>
            </div>
          </div>

          {/* Entry / Exit */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-2.5">
              <div className="flex items-center gap-1 text-[10px] font-medium text-emerald-400">
                <Target className="h-3 w-3" /> 매수 포인트
              </div>
              <div className="mt-1 text-sm font-bold text-[var(--color-text-primary)]">
                {data.timing.entry.idealPrice.toLocaleString()}원
              </div>
              <div className="mt-1 text-[10px] text-[var(--color-text-tertiary)]">
                지지선: {data.timing.entry.supportLevels.map(l => l.toLocaleString()).join(" / ")}
              </div>
              <div className="mt-1 text-[10px] text-[var(--color-text-secondary)]">{data.timing.entry.strategy}</div>
            </div>
            <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-2.5">
              <div className="flex items-center gap-1 text-[10px] font-medium text-red-400">
                <ShieldAlert className="h-3 w-3" /> 매도 / 손절
              </div>
              <div className="mt-1 text-sm font-bold text-[var(--color-text-primary)]">
                {data.timing.exit.targetPrice.toLocaleString()}원
              </div>
              <div className="mt-1 text-[10px] text-[var(--color-text-tertiary)]">
                손절: {data.timing.exit.stopLoss.toLocaleString()} | 저항: {data.timing.exit.resistanceLevels.map(l => l.toLocaleString()).join(" / ")}
              </div>
              <div className="mt-1 text-[10px] text-[var(--color-text-secondary)]">{data.timing.exit.strategy}</div>
            </div>
          </div>

          {/* Technical View */}
          <div className="flex items-center gap-3 rounded-lg bg-[var(--color-surface-elevated)] px-3 py-2 text-xs">
            <span className={`font-medium ${trendBadge(data.technicalView.trend)}`}>{data.technicalView.trend}</span>
            <span className="text-[var(--color-text-tertiary)]">|</span>
            <span className="text-[var(--color-text-secondary)]">모멘텀: {data.technicalView.momentum}</span>
            <span className="text-[var(--color-text-tertiary)]">|</span>
            <span className="text-[var(--color-text-secondary)]">거래량: {data.technicalView.volumeSignal}</span>
          </div>

          {/* Position sizing */}
          <div className="text-[11px] text-[var(--color-text-secondary)]">
            <span className="font-medium text-violet-400">포지션:</span> 추천 비중 {data.positionSizing.recommendedWeight} · {data.positionSizing.splitStrategy}
          </div>

          {/* Risks */}
          {data.risks.length > 0 && (
            <div className="text-[11px]">
              {data.risks.map((r, i) => (
                <span key={i} className="mr-2 text-[var(--color-text-tertiary)]">⚠ {r}</span>
              ))}
            </div>
          )}

          <p className="text-[11px] text-[var(--color-text-tertiary)]">{data.summary}</p>
        </div>
      )}
    </div>
  )
}
