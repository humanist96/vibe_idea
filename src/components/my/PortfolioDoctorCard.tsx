"use client"

import { useState, useCallback } from "react"
import { Card } from "@/components/ui/Card"
import { Stethoscope, Loader2, AlertTriangle, Lightbulb, ShieldCheck, TrendingUp, PieChart } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import type { PortfolioItem } from "@/store/portfolio"
import type { QuoteResult } from "@/app/api/user/portfolio/quotes/route"

interface DiagnosisResult {
  readonly overallScore: number
  readonly grade: string
  readonly diversification: { readonly score: number; readonly comment: string }
  readonly riskLevel: { readonly score: number; readonly comment: string }
  readonly profitability: { readonly score: number; readonly comment: string }
  readonly sectorAnalysis: readonly { readonly sector: string; readonly weight: number; readonly status: string }[]
  readonly warnings: readonly string[]
  readonly recommendations: readonly string[]
  readonly summary: string
}

interface PortfolioDoctorCardProps {
  readonly items: readonly PortfolioItem[]
  readonly quotes: Record<string, QuoteResult>
}

function ScoreRing({ score, size = 80 }: { readonly score: number; readonly size?: number }) {
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - score / 100)
  const color = score >= 80 ? "text-emerald-500" : score >= 60 ? "text-amber-500" : "text-red-500"

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="currentColor" strokeWidth={6} fill="none"
          className="text-slate-100"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="currentColor" strokeWidth={6} fill="none"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn("transition-all duration-700", color)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-lg font-bold", color)}>{score}</span>
      </div>
    </div>
  )
}

function MiniScoreBar({ label, score, icon: Icon }: {
  readonly label: string
  readonly score: number
  readonly icon: React.ComponentType<{ className?: string }>
}) {
  const color = score >= 70 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-red-500"
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-[var(--color-text-tertiary)]">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </span>
        <span className="font-semibold tabular-nums text-[var(--color-text-secondary)]">{score}</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100">
        <div
          className={cn("h-full rounded-full transition-all duration-700", color)}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

export function PortfolioDoctorCard({ items, quotes }: PortfolioDoctorCardProps) {
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const runDiagnosis = useCallback(async () => {
    if (items.length === 0) return
    setLoading(true)
    setError("")

    try {
      const holdings = items.map((item) => {
        const quote = quotes[item.ticker]
        return {
          ticker: item.ticker,
          name: item.name,
          market: item.market,
          sectorKr: item.sectorKr,
          quantity: item.quantity,
          avgPrice: item.avgPrice,
          currentPrice: quote?.price ?? item.avgPrice,
          changePercent: quote?.changePercent ?? 0,
        }
      })

      const res = await fetch("/api/portfolio/diagnosis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ holdings }),
      })
      const json = await res.json()

      if (json.success) {
        setDiagnosis(json.data)
      } else {
        setError(json.error ?? "진단에 실패했습니다.")
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
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 shadow-sm">
              <Stethoscope className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">AI 포트폴리오 닥터</h3>
              <p className="text-[10px] text-[var(--color-text-muted)]">AI가 포트폴리오를 종합 진단합니다</p>
            </div>
          </div>
          <button
            type="button"
            onClick={runDiagnosis}
            disabled={loading}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200",
              "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-sm",
              "hover:from-violet-600 hover:to-purple-700",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Stethoscope className="h-3.5 w-3.5" />
            )}
            {diagnosis ? "재진단" : "진단하기"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 ring-1 ring-red-200/60">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-[var(--color-text-muted)]">
            <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
            AI가 포트폴리오를 분석하고 있습니다...
          </div>
        )}

        {/* Diagnosis Result */}
        {diagnosis && !loading && (
          <div className="space-y-4">
            {/* Overall Score + Grade */}
            <div className="flex items-center gap-6 rounded-xl bg-slate-50/80 p-4">
              <ScoreRing score={diagnosis.overallScore} />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "inline-flex rounded-md px-2 py-0.5 text-xs font-bold",
                    diagnosis.overallScore >= 80 ? "bg-emerald-100 text-emerald-700" :
                    diagnosis.overallScore >= 60 ? "bg-amber-100 text-amber-700" :
                    "bg-red-100 text-red-700"
                  )}>
                    {diagnosis.grade}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">종합 등급</span>
                </div>
                <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
                  {diagnosis.summary}
                </p>
              </div>
            </div>

            {/* Sub-scores */}
            <div className="space-y-3">
              <MiniScoreBar label="분산 투자" score={diagnosis.diversification.score} icon={PieChart} />
              <MiniScoreBar label="수익성" score={diagnosis.profitability.score} icon={TrendingUp} />
              <MiniScoreBar label="안정성" score={100 - diagnosis.riskLevel.score} icon={ShieldCheck} />
            </div>

            {/* Sector Analysis */}
            {diagnosis.sectorAnalysis.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
                  섹터 분석
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {diagnosis.sectorAnalysis.map((s) => (
                    <span
                      key={s.sector}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium",
                        s.status === "과다" ? "bg-red-50 text-red-700 ring-1 ring-red-200/60" :
                        s.status === "부족" ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200/60" :
                        "bg-slate-100 text-slate-600 ring-1 ring-slate-200/60"
                      )}
                    >
                      {s.sector} {s.weight.toFixed(0)}%
                      {s.status !== "적정" && (
                        <span className="text-[9px]">({s.status})</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {diagnosis.warnings.length > 0 && (
              <div className="space-y-1.5">
                <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-amber-600">
                  <AlertTriangle className="h-3 w-3" />
                  주의사항
                </p>
                <ul className="space-y-1">
                  {diagnosis.warnings.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-amber-700">
                      <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {diagnosis.recommendations.length > 0 && (
              <div className="space-y-1.5">
                <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-emerald-600">
                  <Lightbulb className="h-3 w-3" />
                  추천사항
                </p>
                <ul className="space-y-1">
                  {diagnosis.recommendations.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-emerald-700">
                      <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-emerald-400" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Disclaimer */}
            <p className="text-[10px] text-[var(--color-text-muted)] leading-relaxed">
              * AI 진단은 참고용이며 투자 판단의 근거로 사용하지 마세요. 투자 책임은 본인에게 있습니다.
            </p>
          </div>
        )}

        {/* Empty state */}
        {!diagnosis && !loading && !error && (
          <div className="py-4 text-center text-xs text-[var(--color-text-muted)]">
            &lsquo;진단하기&rsquo; 버튼을 눌러 AI 포트폴리오 분석을 시작하세요
          </div>
        )}
      </div>
    </Card>
  )
}
