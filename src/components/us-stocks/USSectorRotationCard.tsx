"use client"

import { useState, useEffect } from "react"
import { RefreshCw, ArrowRight, Loader2, TrendingUp, TrendingDown } from "lucide-react"

interface RotationData {
  phase: string
  phaseDescription: string
  rotationSignal: string
  flowDirection: {
    from: Array<{ sector: string; signal: string }>
    to: Array<{ sector: string; signal: string }>
  }
  sectorRanking: Array<{ rank: number; sector: string; momentum: string; outlook: string }>
  recommendedAllocation: Array<{ sector: string; weight: string; reason: string }>
  contrarian: { sector: string; reason: string }
  summary: string
}

export function USSectorRotationCard() {
  const [data, setData] = useState<RotationData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchSectors = async () => {
      setLoading(true)
      try {
        const res = await fetch("/api/us-stocks/sectors")
        const json = await res.json()
        if (!json.success || !json.data) return

        const sectors = json.data.map((s: { sectorKr: string; return1W?: number | null; return1M?: number | null; return3M?: number | null }) => ({
          name: s.sectorKr,
          changePercent1w: s.return1W ?? 0,
          changePercent1m: s.return1M ?? 0,
          changePercent3m: s.return3M,
        })).filter((s: { name: string }) => s.name)

        if (sectors.length < 3) return

        const aiRes = await fetch("/api/sector/rotation-signal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sectors }),
        })
        const aiJson = await aiRes.json()
        if (aiJson.success) setData(aiJson.data)
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    fetchSectors()
  }, [])

  const phaseColor: Record<string, string> = {
    "회복기": "text-emerald-400 bg-emerald-500/10",
    "확장기": "text-blue-400 bg-blue-500/10",
    "과열기": "text-red-400 bg-red-500/10",
    "침체기": "text-gray-400 bg-gray-500/10",
  }

  const momentumBadge = (m: string) => {
    if (m === "강세") return "text-emerald-400"
    if (m === "약세") return "text-red-400"
    return "text-amber-400"
  }

  return (
    <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4">
      <div className="flex items-center gap-2">
        <RefreshCw className="h-4 w-4 text-blue-400" />
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">미국 섹터 로테이션</h3>
      </div>

      {loading && (
        <div className="mt-4 flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--color-text-tertiary)]" />
        </div>
      )}

      {data && (
        <div className="mt-3 space-y-3">
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${phaseColor[data.phase] ?? "text-gray-400 bg-gray-500/10"}`}>
              {data.phase}
            </span>
            <span className="text-[11px] text-[var(--color-text-secondary)]">{data.phaseDescription}</span>
          </div>

          {(data.flowDirection.from.length > 0 || data.flowDirection.to.length > 0) && (
            <div className="flex items-center gap-2 rounded-lg bg-[var(--color-surface-elevated)] p-2.5">
              <div className="flex-1">
                <div className="text-[9px] font-medium text-red-400 mb-1">자금 이탈</div>
                {data.flowDirection.from.slice(0, 2).map((f, i) => (
                  <div key={i} className="flex items-center gap-1 text-[11px]">
                    <TrendingDown className="h-3 w-3 text-red-400" />
                    <span className="text-[var(--color-text-secondary)]">{f.sector}</span>
                  </div>
                ))}
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-[var(--color-text-tertiary)]" />
              <div className="flex-1">
                <div className="text-[9px] font-medium text-emerald-400 mb-1">자금 유입</div>
                {data.flowDirection.to.slice(0, 2).map((f, i) => (
                  <div key={i} className="flex items-center gap-1 text-[11px]">
                    <TrendingUp className="h-3 w-3 text-emerald-400" />
                    <span className="text-[var(--color-text-secondary)]">{f.sector}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="mb-1 text-[10px] font-medium text-[var(--color-text-tertiary)]">섹터 순위 TOP 5</div>
            {data.sectorRanking.slice(0, 5).map((s) => (
              <div key={s.rank} className="flex items-center justify-between py-0.5 text-[11px]">
                <span className="text-[var(--color-text-tertiary)]">{s.rank}.</span>
                <span className="flex-1 ml-1 text-[var(--color-text-primary)]">{s.sector}</span>
                <span className={`text-[10px] font-medium ${momentumBadge(s.momentum)}`}>{s.momentum}</span>
              </div>
            ))}
          </div>

          <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-2 text-[11px]">
            <span className="font-medium text-amber-400">역발상 기회:</span>{" "}
            <span className="text-[var(--color-text-secondary)]">{data.contrarian.sector} &mdash; {data.contrarian.reason}</span>
          </div>

          <p className="text-[10px] text-[var(--color-text-tertiary)]">{data.summary}</p>
        </div>
      )}
    </div>
  )
}
