"use client"

import { useEffect } from "react"
import { AlertTriangle, RotateCcw, Home } from "lucide-react"
import Link from "next/link"

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Root error boundary caught:", error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 animate-fade-up">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-gain-soft)]">
        <AlertTriangle className="h-8 w-8 text-[var(--color-gain)]" />
      </div>

      <h1 className="mb-2 text-xl font-bold text-[var(--color-text-primary)]">
        문제가 발생했습니다
      </h1>
      <p className="mb-6 max-w-md text-center text-sm text-[var(--color-text-secondary)]">
        페이지를 로드하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
      </p>

      {error.digest && (
        <p className="mb-4 text-xs text-[var(--color-text-tertiary)]">
          오류 코드: {error.digest}
        </p>
      )}

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
          <Home size={14} />
          홈으로
        </Link>
      </div>
    </div>
  )
}
