"use client"

import { useState } from "react"
import { GitCompareArrows, Loader2, Trophy, Crown } from "lucide-react"

interface CompareResult {
  winner: { ticker: string; name: string; reason: string }
  categories: Array<{ name: string; winner: string; ticker: string; comment: string }>
  correlation: string
  diversificationBenefit: string
  investorType: {
    growth: { pick: string; ticker: string }
    value: { pick: string; ticker: string }
    income: { pick: string; ticker: string }
  }
  summary: string
}

export function USSmartCompareWidget() {
  const [tickers, setTickers] = useState(["", ""])
  const [data, setData] = useState<CompareResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const compare = async () => {
    const valid = tickers.filter((t) => t.trim())
    if (valid.length < 2) {
      setError("2개 이상 티커를 입력하세요 (예: AAPL, MSFT)")
      return
    }
    setLoading(true)
    setError("")
    try {
      // Fetch US stock data for each ticker
      const stockPromises = valid.map(async (ticker) => {
        const res = await fetch(`/api/us-stocks/${ticker.trim().toUpperCase()}`)
        if (!res.ok) return null
        const json = await res.json()
        if (!json.success) return null
        const d = json.data
        return {
          ticker: d.symbol,
          name: d.nameKr ?? d.name,
          price: d.quote.price,
          per: d.metrics.pe,
          pbr: d.metrics.pb,
          dividendYield: d.metrics.dividendYield,
          marketCap: d.metrics.marketCap,
          changePercent: d.quote.changePercent,
          sector: d.sectorKr || d.sector,
        }
      })
      const results = await Promise.all(stockPromises)
      const stocks = results.filter(Boolean)

      if (stocks.length < 2) {
        setError("종목 데이터를 가져올 수 없습니다")
        return
      }

      const res = await fetch("/api/stocks/smart-compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stocks }),
      })
      const json = await res.json()
      if (json.success) setData(json.data)
      else setError(json.error || "비교 실패")
    } catch {
      setError("네트워크 오류")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-card)] p-4">
      <div className="flex items-center gap-2">
        <GitCompareArrows className="h-4 w-4 text-purple-400" />
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">AI 종목 비교 (US)</h3>
      </div>

      <div className="mt-3 flex items-center gap-2">
        {tickers.map((t, i) => (
          <input
            key={i}
            value={t}
            onChange={(e) => {
              const next = [...tickers]
              next[i] = e.target.value.toUpperCase()
              setTickers(next)
            }}
            placeholder={i === 0 ? "AAPL" : "MSFT"}
            className="w-0 flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-2.5 py-1.5 text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:border-purple-500 focus:outline-none"
          />
        ))}
        <button
          onClick={compare}
          disabled={loading}
          className="shrink-0 rounded-lg bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-400 transition-colors hover:bg-purple-500/20 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "비교"}
        </button>
      </div>

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      {data && (
        <div className="mt-3 space-y-3">
          <div className="flex items-center gap-2 rounded-lg bg-amber-500/5 border border-amber-500/20 p-3">
            <Crown className="h-5 w-5 text-amber-400" />
            <div>
              <div className="text-sm font-bold text-amber-400">{data.winner.name}</div>
              <div className="text-[11px] text-[var(--color-text-secondary)]">{data.winner.reason}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {data.categories.map((c, i) => (
              <div key={i} className="rounded-lg bg-[var(--color-surface-elevated)] p-2">
                <div className="text-[9px] text-[var(--color-text-tertiary)]">{c.name}</div>
                <div className="flex items-center gap-1 mt-0.5">
                  <Trophy className="h-2.5 w-2.5 text-amber-400" />
                  <span className="text-[11px] font-medium text-[var(--color-text-primary)]">{c.winner}</span>
                </div>
                <div className="mt-0.5 text-[9px] text-[var(--color-text-tertiary)]">{c.comment}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <div>
              <span className="text-[var(--color-text-tertiary)]">성장형:</span>{" "}
              <span className="font-medium text-emerald-400">{data.investorType.growth.pick}</span>
            </div>
            <div>
              <span className="text-[var(--color-text-tertiary)]">가치형:</span>{" "}
              <span className="font-medium text-blue-400">{data.investorType.value.pick}</span>
            </div>
            <div>
              <span className="text-[var(--color-text-tertiary)]">배당형:</span>{" "}
              <span className="font-medium text-amber-400">{data.investorType.income.pick}</span>
            </div>
          </div>

          <p className="text-[10px] text-[var(--color-text-tertiary)]">{data.summary}</p>
        </div>
      )}
    </div>
  )
}
