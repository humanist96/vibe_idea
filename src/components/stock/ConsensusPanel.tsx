"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"

interface ConsensusInfo {
  readonly targetPrice: number | null
  readonly investmentOpinion: string | null
  readonly analystCount: number
}

interface ResearchReport {
  readonly title: string
  readonly provider: string
  readonly date: string
  readonly targetPrice: number | null
}

interface ConsensusData {
  readonly consensus: ConsensusInfo
  readonly reports: readonly ResearchReport[]
}

interface ConsensusPanelProps {
  readonly ticker: string
  readonly currentPrice?: number
}

function formatPrice(value: number | null): string {
  if (value === null) return "--"
  return value.toLocaleString() + "원"
}

function getOpinionColor(opinion: string | null): string {
  if (!opinion) return "text-[var(--color-text-secondary)]"
  if (opinion.includes("매수")) return "text-emerald-400"
  if (opinion.includes("중립")) return "text-amber-400"
  if (opinion.includes("매도")) return "text-red-400"
  return "text-[var(--color-text-secondary)]"
}

export function ConsensusPanel({ ticker, currentPrice }: ConsensusPanelProps) {
  const [data, setData] = useState<ConsensusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchConsensus() {
      setLoading(true)
      setError(false)
      try {
        const res = await fetch(`/api/stocks/${ticker}/consensus`)
        const json = await res.json()
        if (json.success) {
          setData(json.data)
        } else {
          setError(true)
        }
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchConsensus()
  }, [ticker])

  if (loading) {
    return (
      <Card className="animate-fade-up stagger-4">
        <CardHeader>
          <CardTitle>컨센서스</CardTitle>
        </CardHeader>
        <div className="space-y-3">
          <LoadingSkeleton className="h-16 w-full" />
          <LoadingSkeleton className="h-8 w-full" />
        </div>
      </Card>
    )
  }

  if (error || !data) return null

  const { consensus, reports } = data
  const target = consensus.targetPrice
  const upsidePercent =
    target && currentPrice && currentPrice > 0
      ? ((target - currentPrice) / currentPrice) * 100
      : null

  // Gauge: 현재가 대비 목표가 비율 (0~200% range, 100%=목표가 도달)
  const gaugePercent =
    target && currentPrice && target > 0
      ? Math.min(100, (currentPrice / target) * 100)
      : null

  return (
    <Card className="animate-fade-up stagger-4">
      <CardHeader>
        <CardTitle>컨센서스 / 목표주가</CardTitle>
      </CardHeader>

      <div className="space-y-4">
        {/* Opinion + Target Price */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs text-[var(--color-text-muted)]">투자의견</p>
            <p className={`text-lg font-bold ${getOpinionColor(consensus.investmentOpinion)}`}>
              {consensus.investmentOpinion ?? "--"}
            </p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-xs text-[var(--color-text-muted)]">목표주가</p>
            <p className="text-lg font-bold text-[var(--color-text-primary)]">
              {formatPrice(target)}
            </p>
            {upsidePercent !== null && (
              <p
                className={`text-xs font-medium ${
                  upsidePercent >= 0 ? "text-[var(--color-gain)]" : "text-[var(--color-loss)]"
                }`}
              >
                {upsidePercent >= 0 ? "▲" : "▼"} {Math.abs(upsidePercent).toFixed(1)}%
              </p>
            )}
          </div>
        </div>

        {/* Target Price Gauge Bar */}
        {gaugePercent !== null && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] text-[var(--color-text-muted)]">
              <span>현재가 {currentPrice?.toLocaleString()}</span>
              <span>목표가 {target?.toLocaleString()}</span>
            </div>
            <div className="relative h-2.5 w-full rounded-full bg-[var(--color-surface-100)] overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ${
                  gaugePercent >= 100
                    ? "bg-emerald-500"
                    : gaugePercent >= 70
                      ? "bg-amber-500"
                      : "bg-[var(--color-accent-400)]"
                }`}
                style={{ width: `${gaugePercent}%` }}
              />
            </div>
            <p className="text-[10px] text-[var(--color-text-muted)] text-right">
              달성률 {gaugePercent.toFixed(1)}%
            </p>
          </div>
        )}

        {/* Analyst Count */}
        {consensus.analystCount > 0 && (
          <p className="text-[10px] text-[var(--color-text-muted)]">
            애널리스트 리포트 {consensus.analystCount}건
          </p>
        )}

        {/* Research Reports */}
        {reports.length > 0 && (
          <div className="space-y-1 border-t border-[var(--color-border-subtle)] pt-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-2">
              최근 리포트
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {reports.map((report, i) => (
                <div
                  key={`${report.date}-${i}`}
                  className="flex items-start justify-between gap-2 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[var(--color-text-secondary)]">
                      {report.title}
                    </p>
                    <p className="text-[10px] text-[var(--color-text-muted)]">
                      {report.provider} · {report.date}
                    </p>
                  </div>
                  {report.targetPrice !== null && (
                    <span className="shrink-0 tabular-nums text-[var(--color-text-tertiary)]">
                      {report.targetPrice.toLocaleString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
