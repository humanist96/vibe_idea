"use client"

import { useEffect, useCallback, createElement } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { useDashboardLayoutStore } from "@/store/dashboard-layout"
import { getCardDef, CARD_DEFINITIONS } from "./card-registry"
import { DraggableCard } from "./DraggableCard"
import { DashboardEditToolbar } from "./DashboardEditToolbar"

interface DashboardGridProps {
  readonly isLoggedIn: boolean
}

export function DashboardGrid({ isLoggedIn }: DashboardGridProps) {
  const {
    cardOrder,
    hiddenCards,
    isEditing,
    loaded,
    moveCard,
    toggleCard,
    loadFromServer,
  } = useDashboardLayoutStore()

  // Load layout from server on mount
  useEffect(() => {
    if (!isLoggedIn || loaded) return
    const load = async () => {
      try {
        const res = await fetch("/api/user/dashboard-layout")
        const json = await res.json()
        if (json.success && json.data) {
          loadFromServer(json.data.cardOrder, json.data.hiddenCards)
        }
      } catch {
        // Use local store fallback
      }
    }
    load()
  }, [isLoggedIn, loaded, loadFromServer])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor)
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIndex = cardOrder.indexOf(active.id as string)
      const newIndex = cardOrder.indexOf(over.id as string)

      // Prevent moving before fixed cards
      const targetCard = getCardDef(over.id as string)
      if (targetCard?.fixed) return

      if (oldIndex !== -1 && newIndex !== -1) {
        moveCard(oldIndex, newIndex)
      }
    },
    [cardOrder, moveCard]
  )

  // Group cards into rows based on size
  const visibleCards = cardOrder.filter(
    (id) => !hiddenCards.includes(id) || isEditing
  )

  const renderCards = () => {
    const rows: { cards: string[]; type: string }[] = []
    let currentRow: string[] = []
    let currentWidth = 0

    for (const id of visibleCards) {
      const def = getCardDef(id)
      if (!def) continue

      const width = def.size === "full" ? 3 : def.size === "2/3" ? 2 : 1

      if (def.size === "full") {
        // Flush current row
        if (currentRow.length > 0) {
          rows.push({ cards: currentRow, type: "grid" })
          currentRow = []
          currentWidth = 0
        }
        rows.push({ cards: [id], type: "full" })
      } else if (currentWidth + width > 3) {
        // Flush and start new row
        rows.push({ cards: currentRow, type: "grid" })
        currentRow = [id]
        currentWidth = width
      } else {
        currentRow.push(id)
        currentWidth += width
      }
    }
    if (currentRow.length > 0) {
      rows.push({ cards: currentRow, type: "grid" })
    }

    return rows.map((row, rowIdx) => {
      if (row.type === "full") {
        const id = row.cards[0]
        const def = getCardDef(id)!
        return (
          <DraggableCard
            key={id}
            id={id}
            label={def.label}
            isEditing={isEditing}
            isHidden={hiddenCards.includes(id)}
            isFixed={!!def.fixed}
            onToggle={() => toggleCard(id)}
          >
            {createElement(def.component)}
          </DraggableCard>
        )
      }

      return (
        <div key={`row-${rowIdx}`} className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {row.cards.map((id) => {
            const def = getCardDef(id)!
            const colSpan =
              def.size === "2/3" ? "sm:col-span-2" : ""
            return (
              <div key={id} className={colSpan}>
                <DraggableCard
                  id={id}
                  label={def.label}
                  isEditing={isEditing}
                  isHidden={hiddenCards.includes(id)}
                  isFixed={!!def.fixed}
                  onToggle={() => toggleCard(id)}
                >
                  {createElement(def.component)}
                </DraggableCard>
              </div>
            )
          })}
        </div>
      )
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-up">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            대시보드
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
            한국 주식 시장 AI 분석 개요
          </p>
        </div>
        <DashboardEditToolbar isLoggedIn={isLoggedIn} />
      </div>

      {isEditing && (
        <p className="text-xs text-[var(--color-text-tertiary)] bg-blue-500/5 border border-blue-500/10 rounded-lg px-3 py-2">
          카드를 드래그하여 순서를 변경하고, ✕ 버튼으로 숨길 수 있습니다. 변경 후 &quot;저장&quot;을 눌러주세요.
        </p>
      )}

      {/* Sortable cards */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={visibleCards} strategy={verticalListSortingStrategy}>
          <div className="space-y-6">
            {renderCards()}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
