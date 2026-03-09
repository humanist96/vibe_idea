"use client"

import { useState, useEffect } from "react"
import { Zap, TrendingUp, Activity, BarChart3, ArrowUpRight, Loader2 } from "lucide-react"
import { useUSWatchlistStore } from "@/store/us-watchlist"
import { findUSStock } from "@/lib/data/us-stock-registry"
import Link from "next/link"

interface Breakout {
  ticker: string
  name: string
  type: string
  strength: number
  title: string
  description: string
  action: string
}

interface MomentumData {
  breakouts: Breakout[]
  marketMomentum: string
  summary: string
}

const typeIcon: Record<string, typeof Zap> = {
  "52w_high": TrendingUp,
  volume_breakout: BarChart3,
  golden_cross: Activity,
  oversold_bounce: ArrowUpRight,
  trend_acceleration: Zap,
}

const typeLabel: Record<string, string> = {
  "52w_high": "52주 신고가",
  volume_breakout: "거래량 폭발",
  golden_cross: "골든크로스",
  oversold_bounce: "과매도 반등",
  trend_acceleration: "추세 가속",
}

const actionColor: Record<string, string> = {
  "주목": "text-amber-400 bg-amber-500/10",
  "매수 검토": "text-emerald-400 bg-emerald-500/10",
  "관망": "text-gray-400 bg-gray-500/10",
}

export function USMomentumBreakoutCard() {
  const [data, setData] = useState<MomentumData | null>(null)
  const [loading, setLoading] = useState(false)
  const tickers = useUSWatchlistStore((s) => s.tickers)

  useEffect(() => {
    if (tickers.length < 1) return

    const fetchData = async () => {
      setLoading(true)
      try {
        const tickerList = tickers.slice(0, 20)

        // Fetch quotes for US stocks
        const quotePromises = tickerList.map(async (t) => {
          try {
            const res = await fetch(`/api/us-stocks/${t}`)
            const json = await res.json()
            if (!json.success) return null
            const d = json.data
            const entry = findUSStock(t)
            return {
              ticker: t,
              name: entry?.nameKr ?? d.name ?? t,
              price: d.quote.price ?? 0,
              changePercent: d.quote.changePercent ?? 0,
              volume: 0,
              avgVolume: undefined as number | undefined,
              high52w: d.metrics?.fiftyTwoWeekHigh ?? undefined,
              low52w: d.metrics?.fiftyTwoWeekLow ?? undefined,
              rsi: null,
            }
          } catch {
            return null
          }
        })

        const results = await Promise.all(quotePromises)
        const stocks = results.filter(Boolean)

        if (stocks.length === 0) return

        const res = await fetch("/api/market/momentum", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stocks }),
        })
        const json = await res.json()
        if (json.success) setData(json.data)
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [tickers])

  const momentumColor = (m: string) => {
    if (m === "강세") return "text-emerald-400"
    if (m === "약세") return "text-red-400"
    return "text-amber-400"
  }

  return (
    <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-yellow-400" />
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">모멘텀 브레이크아웃 (US)</h3>
        </div>
        {data && (
          <span className={`text-xs font-medium ${momentumColor(data.marketMomentum)}`}>
            시장 {data.marketMomentum}
          </span>
        )}
      </div>

      {loading && (
        <div className="mt-4 flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--color-text-tertiary)]" />
        </div>
      )}

      {!loading && !data && tickers.length === 0 && (
        <p className="mt-3 text-xs text-[var(--color-text-tertiary)]">관심종목을 추가하면 모멘텀 신호를 감지합니다.</p>
      )}

      {data && (
        <div className="mt-3 space-y-2">
          {data.breakouts.length === 0 ? (
            <p className="py-4 text-center text-xs text-[var(--color-text-tertiary)]">현재 감지된 브레이크아웃 신호가 없습니다</p>
          ) : (
            data.breakouts.slice(0, 4).map((b, i) => {
              const Icon = typeIcon[b.type] ?? Zap
              return (
                <Link key={i} href={`/us-stocks/${b.ticker}`} className="flex items-start gap-2 rounded-lg bg-[var(--color-surface-elevated)] p-2.5 transition-colors hover:bg-[var(--color-surface-elevated)]/80">
                  <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-yellow-400" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[var(--color-text-primary)]">{b.name}</span>
                      <span className="text-[10px] text-[var(--color-text-tertiary)]">{typeLabel[b.type] ?? b.type}</span>
                      <div className="ml-auto flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <div key={j} className={`h-1 w-1 rounded-full ${j < b.strength ? "bg-yellow-400" : "bg-[var(--color-border-default)]"}`} />
                        ))}
                      </div>
                    </div>
                    <p className="mt-0.5 text-[10px] text-[var(--color-text-secondary)]">{b.description}</p>
                    <span className={`mt-1 inline-block rounded-full px-1.5 py-0.5 text-[9px] font-medium ${actionColor[b.action] ?? "text-gray-400 bg-gray-500/10"}`}>
                      {b.action}
                    </span>
                  </div>
                </Link>
              )
            })
          )}
          <p className="text-[10px] text-[var(--color-text-tertiary)]">{data.summary}</p>
        </div>
      )}
    </div>
  )
}
