"use client"

import { useMemo, useState, useCallback } from "react"
import type { DividendRecordItem } from "@/lib/portfolio/types"

interface DividendSummaryProps {
  readonly records: readonly DividendRecordItem[]
  readonly onAdd: (record: {
    readonly ticker: string
    readonly market: "KR" | "US"
    readonly amount: number
    readonly currency: "KRW" | "USD"
    readonly receivedAt: string
  }) => void
  readonly isAdding: boolean
}

export function DividendSummary({
  records,
  onAdd,
  isAdding,
}: DividendSummaryProps) {
  const [showForm, setShowForm] = useState(false)
  const [ticker, setTicker] = useState("")
  const [market, setMarket] = useState<"KR" | "US">("KR")
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState<"KRW" | "USD">("KRW")
  const [receivedAt, setReceivedAt] = useState(
    new Date().toISOString().slice(0, 10)
  )

  const stats = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const thisYearRecords = records.filter(
      (r) => new Date(r.receivedAt).getFullYear() === currentYear
    )
    const totalKRW = thisYearRecords
      .filter((r) => r.currency === "KRW")
      .reduce((s, r) => s + r.amount, 0)
    const totalUSD = thisYearRecords
      .filter((r) => r.currency === "USD")
      .reduce((s, r) => s + r.amount, 0)

    const monthlyTotals = new Map<string, number>()
    for (const r of thisYearRecords) {
      const month = new Date(r.receivedAt).toISOString().slice(0, 7)
      monthlyTotals.set(month, (monthlyTotals.get(month) ?? 0) + r.amount)
    }

    return { totalKRW, totalUSD, recordCount: thisYearRecords.length, monthlyTotals }
  }, [records])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const amt = parseFloat(amount)
      if (!ticker.trim() || isNaN(amt) || amt <= 0) return
      onAdd({
        ticker: ticker.trim().toUpperCase(),
        market,
        amount: amt,
        currency,
        receivedAt,
      })
      setTicker("")
      setAmount("")
      setShowForm(false)
    },
    [ticker, market, amount, currency, receivedAt, onAdd]
  )

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
          <p className="text-xs text-[var(--color-text-tertiary)]">
            올해 배당 수익 (KRW)
          </p>
          <p className="mt-1 text-lg font-bold text-[var(--color-text-primary)]">
            {stats.totalKRW.toLocaleString()}원
          </p>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
          <p className="text-xs text-[var(--color-text-tertiary)]">
            올해 배당 수익 (USD)
          </p>
          <p className="mt-1 text-lg font-bold text-[var(--color-text-primary)]">
            ${stats.totalUSD.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
          <p className="text-xs text-[var(--color-text-tertiary)]">
            올해 배당 입금 횟수
          </p>
          <p className="mt-1 text-lg font-bold text-[var(--color-text-primary)]">
            {stats.recordCount}회
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
          배당 입금 내역
        </h3>
        <button
          onClick={() => setShowForm((prev) => !prev)}
          className="rounded-lg bg-[var(--color-brand)] px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
        >
          {showForm ? "취소" : "+ 배당 추가"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4"
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              placeholder="종목코드"
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-base)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)]"
              required
            />
            <select
              value={market}
              onChange={(e) => setMarket(e.target.value as "KR" | "US")}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-base)] px-3 py-2 text-sm text-[var(--color-text-primary)]"
            >
              <option value="KR">한국</option>
              <option value="US">미국</option>
            </select>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="배당금"
              min="0"
              step="any"
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-base)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)]"
              required
            />
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as "KRW" | "USD")}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-base)] px-3 py-2 text-sm text-[var(--color-text-primary)]"
            >
              <option value="KRW">KRW</option>
              <option value="USD">USD</option>
            </select>
            <input
              type="date"
              value={receivedAt}
              onChange={(e) => setReceivedAt(e.target.value)}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-base)] px-3 py-2 text-sm text-[var(--color-text-primary)]"
            />
          </div>
          <button
            type="submit"
            disabled={isAdding}
            className="mt-3 w-full rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isAdding ? "저장 중..." : "저장"}
          </button>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-card)]">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-[var(--color-text-tertiary)]">
                입금일
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-[var(--color-text-tertiary)]">
                종목
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-[var(--color-text-tertiary)]">
                배당금
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-[var(--color-text-tertiary)]">
                통화
              </th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="py-8 text-center text-sm text-[var(--color-text-tertiary)]"
                >
                  배당 내역이 없습니다
                </td>
              </tr>
            ) : (
              records.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-[var(--color-border)] last:border-0"
                >
                  <td className="px-4 py-2 text-[var(--color-text-secondary)]">
                    {new Date(r.receivedAt).toLocaleDateString("ko-KR")}
                  </td>
                  <td className="px-4 py-2 text-[var(--color-text-primary)]">
                    {r.ticker}
                    <span className="ml-1 text-xs text-[var(--color-text-tertiary)]">
                      {r.market}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right text-[var(--color-text-primary)]">
                    {r.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-right text-[var(--color-text-tertiary)]">
                    {r.currency}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
