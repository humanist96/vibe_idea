"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { usePortfolioStore, type PortfolioItem } from "@/store/portfolio"
import { TickerSearchInput } from "./TickerSearchInput"

interface Props {
  readonly editingItem: PortfolioItem | null
  readonly onClose: () => void
}

export function HoldingModal({ editingItem, onClose }: Props) {
  const addItem = usePortfolioStore((s) => s.addItem)
  const updateItem = usePortfolioStore((s) => s.updateItem)

  const [market, setMarket] = useState<"KR" | "US">(editingItem?.market ?? "KR")
  const [ticker, setTicker] = useState(editingItem?.ticker ?? "")
  const [name, setName] = useState(editingItem?.name ?? "")
  const [sectorKr, setSectorKr] = useState(editingItem?.sectorKr ?? "")
  const [quantity, setQuantity] = useState(editingItem?.quantity.toString() ?? "")
  const [avgPrice, setAvgPrice] = useState(editingItem?.avgPrice.toString() ?? "")

  const isEditing = editingItem !== null
  const canSubmit = ticker && name && quantity && avgPrice && parseInt(quantity) > 0 && parseFloat(avgPrice) > 0

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleEsc)
    return () => document.removeEventListener("keydown", handleEsc)
  }, [onClose])

  const handleSelect = (result: { ticker: string; name: string; sector: string }) => {
    setTicker(result.ticker)
    setName(result.name)
    setSectorKr(result.sector)
  }

  const handleSubmit = () => {
    if (!canSubmit) return

    if (isEditing) {
      updateItem(ticker, {
        quantity: parseInt(quantity),
        avgPrice: parseFloat(avgPrice),
      })
    } else {
      addItem({
        ticker,
        market,
        name,
        sectorKr,
        quantity: parseInt(quantity),
        avgPrice: parseFloat(avgPrice),
      })
    }
    onClose()
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-5 sm:p-6 shadow-2xl sm:mx-4 max-h-[90vh] overflow-y-auto">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)]">
            {isEditing ? "종목 수정" : "종목 추가"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-100)] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {!isEditing && (
            <>
              {/* Market Tab */}
              <div className="flex rounded-xl bg-[var(--color-surface-100)] p-1">
                <button
                  type="button"
                  onClick={() => setMarket("KR")}
                  className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all ${
                    market === "KR"
                      ? "bg-white text-[var(--color-text-primary)] shadow-sm"
                      : "text-[var(--color-text-muted)]"
                  }`}
                >
                  🇰🇷 국내
                </button>
                <button
                  type="button"
                  onClick={() => setMarket("US")}
                  className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all ${
                    market === "US"
                      ? "bg-white text-[var(--color-text-primary)] shadow-sm"
                      : "text-[var(--color-text-muted)]"
                  }`}
                >
                  🇺🇸 해외
                </button>
              </div>

              {/* Search */}
              <TickerSearchInput market={market} onSelect={handleSelect} />

              {ticker && (
                <div className="rounded-xl bg-[var(--color-surface-50)] px-4 py-3">
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">{name}</span>
                  <span className="ml-2 text-xs text-[var(--color-text-muted)]">{ticker}</span>
                </div>
              )}
            </>
          )}

          {isEditing && (
            <div className="rounded-xl bg-[var(--color-surface-50)] px-4 py-3">
              <span className="text-sm font-medium text-[var(--color-text-primary)]">{name}</span>
              <span className="ml-2 text-xs text-[var(--color-text-muted)]">{ticker}</span>
            </div>
          )}

          {/* Quantity */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)]">
              수량 (주)
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="10"
              className="w-full rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-50)] px-4 py-3 text-base text-[var(--color-text-primary)] focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>

          {/* Average Price */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)]">
              평균 매수가 ({market === "KR" ? "원" : "USD"})
            </label>
            <input
              type="number"
              min="0"
              step={market === "KR" ? "1" : "0.01"}
              value={avgPrice}
              onChange={(e) => setAvgPrice(e.target.value)}
              placeholder={market === "KR" ? "73000" : "185.50"}
              className="w-full rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-50)] px-4 py-3 text-base text-[var(--color-text-primary)] focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-[var(--color-border-default)] px-4 py-3 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-50)] transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isEditing ? "수정" : "추가"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
