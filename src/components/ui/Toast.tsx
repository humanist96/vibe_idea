"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { X, CheckCircle, AlertCircle, Info, TrendingUp, TrendingDown, AlertTriangle, Calendar } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import type { ToastType } from "@/store/toast"

interface ToastProps {
  readonly id: string
  readonly type: ToastType
  readonly ticker?: string
  readonly message: string
  readonly onDismiss: (id: string) => void
}

const TYPE_STYLES: Record<ToastType, { border: string; icon: typeof CheckCircle | null }> = {
  success: { border: "border-l-emerald-500", icon: CheckCircle },
  error: { border: "border-l-[var(--color-loss)]", icon: AlertCircle },
  info: { border: "border-l-blue-500", icon: Info },
  price_surge: { border: "border-l-emerald-500", icon: TrendingUp },
  price_drop: { border: "border-l-[var(--color-loss)]", icon: TrendingDown },
  market_alert: { border: "border-l-orange-500", icon: AlertTriangle },
  earnings_alert: { border: "border-l-blue-500", icon: Calendar },
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

  const config = TYPE_STYLES[type]
  const Icon = config.icon
  const isClickable = !!ticker || type === "market_alert"

  const handleClick = () => {
    if (ticker) {
      router.push(`/stock/${ticker}`)
    } else if (type === "market_alert") {
      router.push("/")
    }
  }

  return (
    <div
      role="alert"
      onClick={isClickable ? handleClick : undefined}
      className={cn(
        "rounded-xl border border-[var(--color-border-default)] border-l-4 bg-white p-3 shadow-lg shadow-black/8",
        "transition-all duration-300",
        config.border,
        isClickable && "cursor-pointer",
        visible ? "animate-slide-in-right opacity-100" : "opacity-0 translate-x-2"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          {Icon && <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-text-secondary)]" />}
          <p className="text-sm font-medium text-[var(--color-text-primary)]">
            {message}
          </p>
        </div>
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
