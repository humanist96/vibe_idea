"use client"

import { useEffect } from "react"
import { AlertTriangle, RotateCcw, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function StockDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Stock detail error:", error)
  }, [error])

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 animate-fade-up">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-gain-soft)]">
        <AlertTriangle className="h-7 w-7 text-[var(--color-gain)]" />
      </div>

      <h2 className="mb-2 text-lg font-bold text-[var(--color-text-primary)]">
        종목 정보를 불러올 수 없습니다
      </h2>
      <p className="mb-6 max-w-sm text-center text-sm text-[var(--color-text-secondary)]">
        종목 데이터를 가져오는 중 문제가 발생했습니다. 네트워크 연결을 확인하고 다시 시도해주세요.
      </p>

      <div className="flex gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-accent-400)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--color-accent-500)]"
        >
          <RotateCcw size={14} />
          다시 시도
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border-default)] px-5 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-50)]"
        >
          <ArrowLeft size={14} />
          대시보드
        </Link>
      </div>
    </div>
  )
}
