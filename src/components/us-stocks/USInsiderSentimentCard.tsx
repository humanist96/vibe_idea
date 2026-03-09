"use client"

import { useState, useEffect } from "react"
import { Users, TrendingUp, TrendingDown, Loader2 } from "lucide-react"
import Link from "next/link"

interface InsiderSentimentData {
  overallSentiment: string
  sentimentScore: number
  clusterBuys: Array<{ company: string; ticker: string; buyerCount: number; signal: string }>
  notableTransactions: Array<{
    person: string; position: string; type: string; company: string; ticker: string; significance: string; reason: string
  }>
  topBuyStocks: Array<{ ticker: string; company: string; netBuyers: number; signal: string }>
  summary: string
}

interface Props {
  readonly ticker: string
}

export function USInsiderSentimentCard({ ticker }: Props) {
  const [data, setData] = useState<InsiderSentimentData | null>(null)
  const [loading, setLoading] = useState(false)
  const [transactions, setTransactions] = useState<Array<{
    name: string; position: string; type: string; shares: number; price?: number; date: string; ticker: string; companyName: string
  }>>([])

  // Fetch insider transactions
  useEffect(() => {
    const fetchInsider = async () => {
      try {
        const res = await fetch(`/api/us-stocks/insider?symbol=${ticker}`)
        const json = await res.json()
        if (json.success && json.data.transactions.length > 0) {
          const mapped = json.data.transactions.map((t: {
            name: string; title: string; type: string; shares: number; transactionPrice: number; transactionDate: string
          }) => ({
            name: t.name,
            position: t.title || "Insider",
            type: t.type === "buy" ? "매수" : "매도",
            shares: Math.abs(t.shares),
            price: t.transactionPrice,
            date: t.transactionDate,
            ticker,
            companyName: json.data.nameKr ?? json.data.name ?? ticker,
          }))
          setTransactions(mapped)
        }
      } catch {
        // silent
      }
    }
    fetchInsider()
  }, [ticker])

  // Analyze when transactions are loaded
  useEffect(() => {
    if (transactions.length === 0) return

    const analyze = async () => {
      setLoading(true)
      try {
        const res = await fetch("/api/insider/sentiment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transactions: transactions.slice(0, 50) }),
        })
        const json = await res.json()
        if (json.success) setData(json.data)
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    analyze()
  }, [transactions])

  const sentimentColor = (s: string) => {
    if (s.includes("매수")) return "text-emerald-400"
    if (s.includes("매도")) return "text-red-400"
    return "text-amber-400"
  }

  const scoreColor = (s: number) => {
    if (s > 30) return "bg-emerald-500"
    if (s < -30) return "bg-red-500"
    return "bg-amber-500"
  }

  if (transactions.length === 0 && !loading) return null

  return (
    <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-cyan-400" />
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">내부자 심리 분석</h3>
      </div>

      {loading && (
        <div className="mt-4 flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--color-text-tertiary)]" />
        </div>
      )}

      {data && (
        <div className="mt-3 space-y-3">
          <div className="flex items-center gap-3">
            <span className={`text-base font-bold ${sentimentColor(data.overallSentiment)}`}>
              {data.overallSentiment}
            </span>
            <div className="flex-1">
              <div className="h-2 rounded-full bg-[var(--color-surface-elevated)]">
                <div
                  className={`h-full rounded-full transition-all ${scoreColor(data.sentimentScore)}`}
                  style={{ width: `${Math.abs(data.sentimentScore) / 2 + 50}%` }}
                />
              </div>
              <div className="mt-0.5 flex justify-between text-[9px] text-[var(--color-text-tertiary)]">
                <span>매도</span>
                <span>{data.sentimentScore > 0 ? "+" : ""}{data.sentimentScore}</span>
                <span>매수</span>
              </div>
            </div>
          </div>

          {data.topBuyStocks.length > 0 && (
            <div>
              <div className="mb-1 text-[10px] font-medium text-emerald-400">내부자 순매수 TOP</div>
              {data.topBuyStocks.slice(0, 3).map((s, i) => (
                <Link key={i} href={`/us-stocks/${s.ticker}`} className="flex items-center justify-between py-1 text-xs hover:opacity-80">
                  <span className="font-medium text-[var(--color-text-primary)]">{s.company}</span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <TrendingUp className="h-3 w-3" />
                    {s.netBuyers}명 순매수
                  </span>
                </Link>
              ))}
            </div>
          )}

          {data.notableTransactions.length > 0 && (
            <div>
              <div className="mb-1 text-[10px] font-medium text-[var(--color-text-tertiary)]">주목 거래</div>
              {data.notableTransactions.slice(0, 2).map((t, i) => (
                <div key={i} className="rounded-lg bg-[var(--color-surface-elevated)] p-2 mb-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-medium text-[var(--color-text-primary)]">{t.person} ({t.position})</span>
                    <span className={t.type.includes("매수") ? "text-emerald-400" : "text-red-400"}>
                      {t.type === "매수" ? <TrendingUp className="inline h-3 w-3" /> : <TrendingDown className="inline h-3 w-3" />}
                      {" "}{t.type}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[10px] text-[var(--color-text-tertiary)]">{t.company} · {t.reason}</div>
                </div>
              ))}
            </div>
          )}

          <p className="text-[10px] text-[var(--color-text-tertiary)]">{data.summary}</p>
        </div>
      )}
    </div>
  )
}
