"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, X, Eye } from "lucide-react"
import type { ReactNode } from "react"

interface DraggableCardProps {
  readonly id: string
  readonly label: string
  readonly isEditing: boolean
  readonly isHidden: boolean
  readonly isFixed: boolean
  readonly onToggle: () => void
  readonly children: ReactNode
}

export function DraggableCard({
  id,
  label,
  isEditing,
  isHidden,
  isFixed,
  onToggle,
  children,
}: DraggableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isEditing || isFixed })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : isHidden ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
  }

  if (isHidden && !isEditing) return null

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {isEditing && (
        <div className="absolute -top-2 left-0 right-0 z-10 flex items-center justify-between">
          <div className="flex items-center gap-1">
            {!isFixed && (
              <button
                {...attributes}
                {...listeners}
                className="flex items-center gap-1 rounded-md bg-[var(--color-surface-elevated)] border border-[var(--color-border-default)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-text-secondary)] shadow-sm cursor-grab active:cursor-grabbing hover:bg-[var(--color-surface-card)]"
              >
                <GripVertical className="h-3 w-3" />
                {label}
              </button>
            )}
            {isFixed && (
              <span className="rounded-md bg-[var(--color-surface-elevated)] border border-[var(--color-border-default)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-text-tertiary)]">
                {label} (고정)
              </span>
            )}
          </div>
          {!isFixed && (
            <button
              onClick={onToggle}
              className="flex items-center gap-1 rounded-md bg-[var(--color-surface-elevated)] border border-[var(--color-border-default)] px-1.5 py-0.5 text-[10px] shadow-sm hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-colors"
            >
              {isHidden ? (
                <Eye className="h-3 w-3 text-emerald-400" />
              ) : (
                <X className="h-3 w-3" />
              )}
            </button>
          )}
        </div>
      )}
      <div className={isEditing ? "mt-4" : ""}>
        {isHidden && isEditing ? (
          <div className="rounded-xl border-2 border-dashed border-[var(--color-border-default)] bg-[var(--color-surface-elevated)]/50 p-6 text-center">
            <p className="text-xs text-[var(--color-text-tertiary)]">{label} (숨김)</p>
          </div>
        ) : (
          children
        )}
      </div>
      {isEditing && !isFixed && (
        <div className="absolute inset-0 rounded-xl ring-2 ring-blue-500/20 pointer-events-none" />
      )}
    </div>
  )
}
