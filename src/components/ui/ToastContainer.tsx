"use client"

import { useCallback } from "react"
import { Toast } from "./Toast"
import { useToastStore } from "@/store/toast"

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)
  const removeToast = useToastStore((s) => s.removeToast)

  const handleDismiss = useCallback(
    (id: string) => {
      removeToast(id)
    },
    [removeToast]
  )

  if (toasts.length === 0) return null

  return (
    <div className="fixed right-4 top-20 z-50 flex w-80 flex-col gap-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          ticker={toast.ticker}
          message={toast.message}
          onDismiss={handleDismiss}
        />
      ))}
    </div>
  )
}
