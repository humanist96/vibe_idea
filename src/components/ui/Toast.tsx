"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"
import { cn } from "@/lib/utils/cn"

interface ToastProps {
  readonly id: string
  readonly type: "insider_buy" | "insider_sell"
  readonly ticker: string
  readonly message: string
  readonly onDismiss: (id: string) => void
}

export function Toast({ id, type, ticker, message, onDismiss }: ToastProps) {
  const router = useRouter()
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onDismiss(id), 300)
    }, 5000)
    return () => clearTimeout(timer)
  }, [id, onDismiss])

  const borderColor =
    type === "insider_buy"
      ? "border-l-[var(--color-gain)]"
      : "border-l-[var(--color-loss)]"

  return (
    <div
      role="alert"
      onClick={() => router.push(`/stock/${ticker}`)}
      className={cn(
        "cursor-pointer rounded-xl border border-[var(--color-border-default)] border-l-4 bg-white p-3 shadow-lg shadow-black/8",
        "transition-all duration-300",
        borderColor,
        visible ? "animate-slide-in-right opacity-100" : "opacity-0 translate-x-2"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-[var(--color-text-primary)]">
          {message}
        </p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onDismiss(id)
          }}
          className="shrink-0 rounded-md p-0.5 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-secondary)]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
