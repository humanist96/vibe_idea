"use client"

import { useCallback } from "react"
import { X, Equal, TrendingUp, BarChart3, GripVertical } from "lucide-react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import type { DragEndEvent } from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useDividendPortfolioStore } from "@/store/dividend-portfolio"
import { MARKET_BADGE_STYLES } from "./constants"
import type { DividendPortfolioItem, DividendMarket } from "@/lib/dividend/dividend-types"

function SortableItem({
  item,
  onUpdateWeight,
  onRemove,
}: {
  readonly item: DividendPortfolioItem
  readonly onUpdateWeight: (ticker: string, market: DividendMarket, weight: number) => void
  readonly onRemove: (ticker: string, market: DividendMarket) => void
}) {
  const id = `${item.market}:${item.ticker}`
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-lg bg-[var(--color-glass-1)] px-3 py-2.5 ring-1 ring-[var(--color-border-subtle)]"
    >
      <button
        type="button"
        className="cursor-grab touch-none rounded p-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors active:cursor-grabbing"
        aria-label="드래그하여 순서 변경"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      <span
        className={
          "rounded px-1.5 py-0.5 text-[10px] font-bold " +
          MARKET_BADGE_STYLES[item.market]
        }
      >
        {item.market}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-[var(--color-text-primary)]">
          {item.nameKr || item.name}
        </div>
        <div className="text-[10px] text-[var(--color-text-muted)]">
          {item.ticker} · {item.sectorKr}
        </div>
      </div>

      {/* Weight slider */}
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={0}
          max={100}
          step={0.5}
          value={item.weight}
          aria-label={`${item.nameKr || item.name} 비중 조절`}
          onChange={(e) =>
            onUpdateWeight(item.ticker, item.market, Number(e.target.value))
          }
          className="h-1.5 w-20 cursor-pointer appearance-none rounded-full bg-[var(--color-glass-3)] sm:w-32 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-400"
        />
        <span className="w-12 text-right text-xs tabular-nums font-medium text-[var(--color-text-secondary)]">
          {item.weight.toFixed(1)}%
        </span>
      </div>

      <button
        type="button"
        onClick={() => onRemove(item.ticker, item.market)}
        aria-label={`${item.nameKr || item.name} 제거`}
        className="rounded-md p-1 text-[var(--color-text-muted)] hover:bg-red-500/10 hover:text-red-400 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

export function PortfolioItemList() {
  const {
    items,
    removeItem,
    updateWeight,
    reorderItems,
    distributeEqual,
    distributeByYield,
    distributeByMarketCap,
  } = useDividendPortfolioStore()

  const totalWeight = items.reduce((sum, i) => sum + i.weight, 0)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const sortableIds = items.map((item) => `${item.market}:${item.ticker}`)

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIndex = sortableIds.indexOf(String(active.id))
      const newIndex = sortableIds.indexOf(String(over.id))
      if (oldIndex === -1 || newIndex === -1) return

      const reordered = [...items]
      const [moved] = reordered.splice(oldIndex, 1)
      reordered.splice(newIndex, 0, moved)
      reorderItems(reordered)
    },
    [items, sortableIds, reorderItems]
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={distributeEqual}
          disabled={items.length === 0}
          className="flex items-center gap-1.5 rounded-md bg-[var(--color-glass-2)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-tertiary)] ring-1 ring-[var(--color-border-subtle)] hover:text-[var(--color-text-secondary)] disabled:opacity-30 transition-all"
        >
          <Equal className="h-3 w-3" />
          균등 배분
        </button>
        <button
          type="button"
          onClick={() => {
            distributeByYield(new Map())
          }}
          disabled={items.length === 0}
          className="flex items-center gap-1.5 rounded-md bg-[var(--color-glass-2)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-tertiary)] ring-1 ring-[var(--color-border-subtle)] hover:text-[var(--color-text-secondary)] disabled:opacity-30 transition-all"
        >
          <TrendingUp className="h-3 w-3" />
          수익률 기반
        </button>
        <button
          type="button"
          onClick={() => {
            distributeByMarketCap(new Map())
          }}
          disabled={items.length === 0}
          className="flex items-center gap-1.5 rounded-md bg-[var(--color-glass-2)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-tertiary)] ring-1 ring-[var(--color-border-subtle)] hover:text-[var(--color-text-secondary)] disabled:opacity-30 transition-all"
        >
          <BarChart3 className="h-3 w-3" />
          시총 기반
        </button>
        <span
          className={
            "ml-auto text-xs tabular-nums " +
            (Math.abs(totalWeight - 100) < 0.5
              ? "text-emerald-400"
              : "text-amber-400")
          }
        >
          합계: {totalWeight.toFixed(1)}%
        </span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--color-border-subtle)] py-8 text-center text-xs text-[var(--color-text-muted)]">
          종목을 추가해주세요
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortableIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {items.map((item) => (
                <SortableItem
                  key={`${item.market}:${item.ticker}`}
                  item={item}
                  onUpdateWeight={updateWeight}
                  onRemove={removeItem}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}
