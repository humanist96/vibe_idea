"use client"

import { useState } from "react"
import { Settings2, Save, RotateCcw, X, Eye, EyeOff, Loader2 } from "lucide-react"
import { useDashboardLayoutStore } from "@/store/dashboard-layout"
import { CARD_DEFINITIONS } from "./card-registry"

interface DashboardEditToolbarProps {
  readonly isLoggedIn: boolean
}

export function DashboardEditToolbar({ isLoggedIn }: DashboardEditToolbarProps) {
  const { isEditing, setEditing, hiddenCards, toggleCard, resetToDefault, cardOrder } =
    useDashboardLayoutStore()
  const [saving, setSaving] = useState(false)
  const [showPanel, setShowPanel] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      if (isLoggedIn) {
        await fetch("/api/user/dashboard-layout", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cardOrder, hiddenCards }),
        })
      }
      setEditing(false)
      setShowPanel(false)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    resetToDefault()
    if (isLoggedIn) {
      await fetch("/api/user/dashboard-layout", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardOrder: CARD_DEFINITIONS.map((c) => c.id),
          hiddenCards: [],
        }),
      })
    }
  }

  const handleCancel = () => {
    setEditing(false)
    setShowPanel(false)
  }

  if (!isEditing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-md transition-colors hover:bg-blue-700"
      >
        <Settings2 className="h-3.5 w-3.5" />
        대시보드 편집
      </button>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 text-xs font-medium text-blue-400">
          <Settings2 className="h-3.5 w-3.5" />
          편집 모드
        </div>

        <button
          onClick={() => setShowPanel(!showPanel)}
          className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-card)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] transition-colors"
        >
          {showPanel ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          카드 표시/숨김
        </button>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-card)] px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/10 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          초기화
        </button>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          저장
        </button>

        <button
          onClick={handleCancel}
          className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-card)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-tertiary)] hover:text-red-400 hover:border-red-500/30 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
          취소
        </button>
      </div>

      {showPanel && (
        <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-4">
          <p className="mb-3 text-xs font-medium text-[var(--color-text-secondary)]">카드 표시/숨김 설정</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {CARD_DEFINITIONS.filter((c) => !c.fixed).map((card) => {
              const hidden = hiddenCards.includes(card.id)
              return (
                <button
                  key={card.id}
                  onClick={() => toggleCard(card.id)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors ${
                    hidden
                      ? "border-[var(--color-border-default)] bg-[var(--color-surface-elevated)] text-[var(--color-text-tertiary)]"
                      : "border-blue-500/30 bg-blue-500/10 text-blue-400"
                  }`}
                >
                  {hidden ? (
                    <EyeOff className="h-3 w-3 shrink-0" />
                  ) : (
                    <Eye className="h-3 w-3 shrink-0" />
                  )}
                  {card.label}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
