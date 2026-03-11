"use client"

import { useState, useCallback } from "react"
import type { TransactionRecord } from "@/lib/portfolio/types"

interface TransactionHistoryProps {
  readonly transactions: readonly TransactionRecord[]
  readonly onAdd: (tx: {
    readonly ticker: string
    readonly market: "KR" | "US"
    readonly type: "BUY" | "SELL"
    readonly quantity: number
    readonly price: number
    readonly fee: number
    readonly date: string
    readonly note?: string
  }) => void
  readonly isAdding: boolean
}

export function TransactionHistory({
  transactions,
  onAdd,
  isAdding,
}: TransactionHistoryProps) {
  const [showForm, setShowForm] = useState(false)
  const [ticker, setTicker] = useState("")
  const [market, setMarket] = useState<"KR" | "US">("KR")
  const [type, setType] = useState<"BUY" | "SELL">("BUY")
  const [quantity, setQuantity] = useState("")
  const [price, setPrice] = useState("")
  const [fee, setFee] = useState("0")
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState("")

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const qty = parseFloat(quantity)
      const prc = parseFloat(price)
      const f = parseFloat(fee)
      if (!ticker.trim() || isNaN(qty) || isNaN(prc) || qty <= 0 || prc <= 0) {
        return
      }
      onAdd({
        ticker: ticker.trim().toUpperCase(),
        market,
        type,
        quantity: qty,
        price: prc,
        fee: isNaN(f) ? 0 : f,
        date,
        ...(note.trim() ? { note: note.trim() } : {}),
      })
      setTicker("")
      setQuantity("")
      setPrice("")
      setFee("0")
      setNote("")
      setShowForm(false)
    },
    [ticker, market, type, quantity, price, fee, date, note, onAdd]
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
          거래 내역
        </h3>
        <button
          onClick={() => setShowForm((prev) => !prev)}
          className="rounded-lg bg-[var(--color-brand)] px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
        >
          {showForm ? "취소" : "+ 거래 추가"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4"
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "BUY" | "SELL")}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-base)] px-3 py-2 text-sm text-[var(--color-text-primary)]"
            >
              <option value="BUY">매수</option>
              <option value="SELL">매도</option>
            </select>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-base)] px-3 py-2 text-sm text-[var(--color-text-primary)]"
            />
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="수량"
              min="0"
              step="any"
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-base)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)]"
              required
            />
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="가격"
              min="0"
              step="any"
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-base)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)]"
              required
            />
            <input
              type="number"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              placeholder="수수료"
              min="0"
              step="any"
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-base)] px-3 py-2 text-sm text-[var(--color-text-primary)]"
            />
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="메모 (선택)"
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
                날짜
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-[var(--color-text-tertiary)]">
                종목
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-[var(--color-text-tertiary)]">
                유형
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-[var(--color-text-tertiary)]">
                수량
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-[var(--color-text-tertiary)]">
                가격
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-[var(--color-text-tertiary)]">
                수수료
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-8 text-center text-sm text-[var(--color-text-tertiary)]"
                >
                  거래 내역이 없습니다
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr
                  key={tx.id}
                  className="border-b border-[var(--color-border)] last:border-0"
                >
                  <td className="px-4 py-2 text-[var(--color-text-secondary)]">
                    {new Date(tx.date).toLocaleDateString("ko-KR")}
                  </td>
                  <td className="px-4 py-2 text-[var(--color-text-primary)]">
                    {tx.ticker}
                    <span className="ml-1 text-xs text-[var(--color-text-tertiary)]">
                      {tx.market}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${
                        tx.type === "BUY"
                          ? "bg-red-500/10 text-red-400"
                          : "bg-blue-500/10 text-blue-400"
                      }`}
                    >
                      {tx.type === "BUY" ? "매수" : "매도"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right text-[var(--color-text-primary)]">
                    {tx.quantity.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-right text-[var(--color-text-primary)]">
                    {tx.price.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-right text-[var(--color-text-tertiary)]">
                    {tx.fee.toLocaleString()}
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
