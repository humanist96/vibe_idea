"use client"

import { useState, useCallback, useEffect } from "react"
import { Save, FolderOpen, Trash2 } from "lucide-react"
import { useDividendPortfolioStore } from "@/store/dividend-portfolio"
import type { SavedDividendPortfolio } from "@/lib/dividend/dividend-types"

export function PortfolioSaveLoad() {
  const {
    items, settings, savedPortfolioId, savedPortfolioName,
    setSavedId, loadFromSaved,
  } = useDividendPortfolioStore()

  const [showLoadModal, setShowLoadModal] = useState(false)
  const [portfolios, setPortfolios] = useState<readonly SavedDividendPortfolio[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPortfolios = useCallback(async () => {
    setLoadingList(true)
    try {
      const res = await fetch("/api/dividend-lab/portfolio")
      if (!res.ok) throw new Error("Failed")
      const json = await res.json()
      if (json.success) setPortfolios(json.data)
    } catch {
      setError("포트폴리오 목록을 불러오지 못했습니다.")
    } finally {
      setLoadingList(false)
    }
  }, [])

  useEffect(() => {
    if (showLoadModal) fetchPortfolios()
  }, [showLoadModal, fetchPortfolios])

  async function handleSave() {
    if (items.length === 0) return
    setSaving(true)
    setError(null)
    try {
      const name = savedPortfolioName ?? `배당 포트폴리오 ${new Date().toLocaleDateString("ko-KR")}`

      if (savedPortfolioId) {
        // Update existing
        const res = await fetch(`/api/dividend-lab/portfolio/${savedPortfolioId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            ...settings,
            items: items.map((i) => ({
              ticker: i.ticker,
              market: i.market,
              weight: i.weight,
            })),
          }),
        })
        if (!res.ok) throw new Error("Update failed")
      } else {
        // Create new
        const res = await fetch("/api/dividend-lab/portfolio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            ...settings,
            items: items.map((i) => ({
              ticker: i.ticker,
              market: i.market,
              weight: i.weight,
            })),
          }),
        })
        if (!res.ok) throw new Error("Create failed")
        const json = await res.json()
        if (json.success && json.data?.id) {
          setSavedId(json.data.id, name)
        }
      }
    } catch {
      setError("저장에 실패했습니다.")
    } finally {
      setSaving(false)
    }
  }

  function handleLoad(portfolio: SavedDividendPortfolio) {
    loadFromSaved(
      portfolio.id,
      portfolio.name,
      {
        totalAmount: portfolio.totalAmount,
        period: portfolio.period,
        drip: portfolio.drip,
        monthlyAdd: portfolio.monthlyAdd,
        dividendGrowthRate: 3,
      },
      portfolio.items.map((i) => ({
        ticker: i.ticker,
        market: i.market,
        weight: i.weight,
        name: i.ticker,
        nameKr: i.ticker,
        sectorKr: "",
      })),
    )
    setShowLoadModal(false)
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/dividend-lab/portfolio/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")
      setPortfolios(portfolios.filter((p) => p.id !== id))
      if (savedPortfolioId === id) setSavedId(null, null)
    } catch {
      setError("삭제에 실패했습니다.")
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={items.length === 0 || saving}
          className="flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/30 hover:bg-emerald-500/20 disabled:opacity-30 transition-all"
        >
          <Save className="h-3.5 w-3.5" />
          {saving ? "저장 중..." : savedPortfolioId ? "업데이트" : "저장"}
        </button>
        <button
          type="button"
          onClick={() => setShowLoadModal(true)}
          className="flex items-center gap-1.5 rounded-md bg-[var(--color-glass-2)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-tertiary)] ring-1 ring-[var(--color-border-subtle)] hover:text-[var(--color-text-secondary)] transition-all"
        >
          <FolderOpen className="h-3.5 w-3.5" />
          불러오기
        </button>
        {savedPortfolioName && (
          <span className="text-[10px] text-[var(--color-text-muted)] truncate max-w-32">
            {savedPortfolioName}
          </span>
        )}
      </div>

      {error && (
        <div className="mt-2 text-xs text-red-400">{error}</div>
      )}

      {/* Load modal */}
      {showLoadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-xl bg-[var(--color-glass-3)] p-5 ring-1 ring-[var(--color-border-subtle)] shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                포트폴리오 불러오기
              </h3>
              <button
                type="button"
                onClick={() => setShowLoadModal(false)}
                className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
              >
                닫기
              </button>
            </div>

            {loadingList ? (
              <div className="py-8 text-center text-xs text-[var(--color-text-muted)]">
                불러오는 중...
              </div>
            ) : portfolios.length === 0 ? (
              <div className="py-8 text-center text-xs text-[var(--color-text-muted)]">
                저장된 포트폴리오가 없습니다.
              </div>
            ) : (
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {portfolios.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 rounded-lg bg-[var(--color-glass-1)] px-3 py-2.5 ring-1 ring-[var(--color-border-subtle)]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                        {p.name}
                      </div>
                      <div className="text-[10px] text-[var(--color-text-muted)]">
                        {p.items.length}종목 · {p.totalAmount.toLocaleString()}만원 · {p.period}년
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleLoad(p)}
                      className="rounded-md bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400 hover:bg-blue-500/20 transition-colors"
                    >
                      적용
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id)}
                      aria-label={`${p.name} 삭제`}
                      className="rounded-md p-1 text-[var(--color-text-muted)] hover:bg-red-500/10 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
