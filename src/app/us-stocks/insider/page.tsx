"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { UserCheck, Search } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { searchUSStocks } from "@/lib/data/us-stock-registry"

interface InsiderTransaction {
  readonly name: string
  readonly title: string
  readonly isDirector: boolean
  readonly isOfficer: boolean
  readonly shares: number
  readonly change: number
  readonly filingDate: string
  readonly transactionDate: string
  readonly transactionCode: string
  readonly transactionPrice: number
  readonly sharesAfter: number | null
  readonly securityTitle: string
  readonly type: "buy" | "sell" | "other"
}

interface InsiderData {
  readonly symbol: string
  readonly name: string
  readonly nameKr: string
  readonly transactions: readonly InsiderTransaction[]
  readonly summary: {
    readonly totalTransactions: number
    readonly buys: number
    readonly sells: number
  }
}

export default function USInsiderPage() {
  const [symbol, setSymbol] = useState("")
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<{ symbol: string; nameKr: string }[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [data, setData] = useState<InsiderData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (query.length < 1) {
      setSuggestions([])
      return
    }
    const timer = setTimeout(() => {
      const found = searchUSStocks(query, 5)
      setSuggestions(found.map((s) => ({ symbol: s.symbol, nameKr: s.nameKr })))
    }, 200)
    return () => clearTimeout(timer)
  }, [query])

  const fetchInsider = useCallback(async (sym: string) => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/us-stocks/insider?symbol=${sym}`)
      const json = await res.json()
      if (json.success) {
        setData(json.data)
      } else {
        setError(json.error ?? "데이터를 불러올 수 없습니다")
        setData(null)
      }
    } catch {
      setError("네트워크 오류가 발생했습니다")
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSelect = (sym: string) => {
    setSymbol(sym)
    setQuery(sym)
    setShowSuggestions(false)
    fetchInsider(sym)
  }

  const formatRole = (t: InsiderTransaction): string => {
    if (t.title) return t.title
    const roles: string[] = []
    if (t.isOfficer) roles.push("임원")
    if (t.isDirector) roles.push("이사")
    return roles.join(", ") || "-"
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          US 내부자 거래
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
          SEC Form 4 기반 내부자 매수/매도 현황
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md animate-fade-up stagger-1">
        <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border-default)] bg-white px-3 py-2">
          <Search size={14} className="text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="종목명 또는 심볼 입력 (예: AAPL)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setShowSuggestions(true)
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && query.trim()) {
                handleSelect(query.trim().toUpperCase())
              }
            }}
            className="w-full bg-transparent text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
          />
        </div>
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-xl border border-[var(--color-border-default)] bg-white shadow-lg">
            {suggestions.map((s) => (
              <button
                key={s.symbol}
                type="button"
                onClick={() => handleSelect(s.symbol)}
                className="flex w-full items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-[var(--color-surface-50)] first:rounded-t-xl last:rounded-b-xl"
              >
                <span className="text-[var(--color-text-primary)]">{s.nameKr}</span>
                <span className="font-mono text-xs text-[var(--color-text-tertiary)]">{s.symbol}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <LoadingSkeleton className="h-64 w-full rounded-lg animate-fade-up stagger-2" />
      ) : error ? (
        <Card className="animate-fade-up stagger-2">
          <div className="flex flex-col items-center py-16">
            <p className="text-sm text-[var(--color-loss)]">{error}</p>
          </div>
        </Card>
      ) : !data ? (
        <Card className="animate-fade-up stagger-2">
          <div className="flex flex-col items-center py-16">
            <UserCheck className="mb-4 h-10 w-10 text-[var(--color-text-muted)]" />
            <p className="text-sm text-[var(--color-text-secondary)]">
              종목을 검색하여 내부자 거래를 확인하세요
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* Summary */}
          <div className="grid gap-4 sm:grid-cols-3 animate-fade-up stagger-2">
            <div className="glass-card rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase text-[var(--color-text-muted)]">총 거래</p>
              <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">{data.summary.totalTransactions}</p>
            </div>
            <div className="glass-card rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase text-[var(--color-text-muted)]">매수</p>
              <p className="mt-1 text-2xl font-bold text-[var(--color-gain)]">{data.summary.buys}</p>
            </div>
            <div className="glass-card rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase text-[var(--color-text-muted)]">매도</p>
              <p className="mt-1 text-2xl font-bold text-[var(--color-loss)]">{data.summary.sells}</p>
            </div>
          </div>

          {/* Transactions table */}
          <Card className="animate-fade-up stagger-3">
            <CardHeader>
              <CardTitle>
                <span className="flex items-center gap-2">
                  <UserCheck className="h-3.5 w-3.5 text-[var(--color-accent-500)]" />
                  {data.nameKr} ({data.symbol}) 내부자 거래
                </span>
              </CardTitle>
            </CardHeader>

            {data.transactions.length === 0 ? (
              <p className="py-12 text-center text-sm text-[var(--color-text-muted)]">
                내부자 거래 데이터가 없습니다.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-border-subtle)]">
                      <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">이름</th>
                      <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">직위</th>
                      <th className="pb-2 text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">유형</th>
                      <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">수량</th>
                      <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">거래가격</th>
                      <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">보유주식</th>
                      <th className="pb-2 text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">거래일</th>
                      <th className="pb-2 text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">공시일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.transactions.slice(0, 50).map((t, i) => (
                      <tr key={i} className="table-row-hover border-b border-[var(--color-border-subtle)] last:border-0">
                        <td className="py-2.5 text-xs font-medium text-[var(--color-text-primary)]">
                          {t.name}
                        </td>
                        <td className="py-2.5 text-xs text-[var(--color-text-secondary)]">
                          {formatRole(t)}
                        </td>
                        <td className="py-2.5 text-center">
                          <span className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            t.type === "buy"
                              ? "bg-green-50 text-green-700"
                              : t.type === "sell"
                                ? "bg-red-50 text-red-700"
                                : "bg-gray-50 text-gray-600"
                          )}>
                            {t.type === "buy" ? "매수" : t.type === "sell" ? "매도" : "기타"}
                          </span>
                        </td>
                        <td className={cn(
                          "py-2.5 text-right tabular-nums text-xs",
                          t.change > 0 ? "text-[var(--color-gain)]" : t.change < 0 ? "text-[var(--color-loss)]" : "text-[var(--color-text-tertiary)]"
                        )}>
                          {t.change > 0 ? "+" : ""}{t.change.toLocaleString()}
                        </td>
                        <td className="py-2.5 text-right tabular-nums text-xs text-[var(--color-text-secondary)]">
                          {t.transactionPrice > 0 ? `$${t.transactionPrice.toFixed(2)}` : "-"}
                        </td>
                        <td className="py-2.5 text-right tabular-nums text-xs text-[var(--color-text-secondary)]">
                          {t.sharesAfter != null ? t.sharesAfter.toLocaleString() : "-"}
                        </td>
                        <td className="py-2.5 text-center text-xs text-[var(--color-text-secondary)]">{t.transactionDate}</td>
                        <td className="py-2.5 text-center text-xs text-[var(--color-text-muted)]">{t.filingDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
