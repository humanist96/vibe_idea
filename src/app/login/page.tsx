"use client"

import { signIn } from "next-auth/react"
import Link from "next/link"

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="glass-card w-full max-w-sm p-8">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/20">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-7 w-7 text-white"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
          </div>
          <h1 className="font-display text-xl font-bold text-[var(--color-text-primary)]">
            <span className="text-[var(--color-text-muted)]">&gt;koscom</span>{" "}
            Invest<span className="text-[var(--color-accent-500)]">Hub</span>
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            로그인하여 데이터를 동기화하세요
          </p>
        </div>

        {/* OAuth buttons */}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-[var(--color-border-default)] bg-white px-4 py-3 text-sm font-medium text-[var(--color-text-primary)] transition-all hover:bg-[var(--color-surface-50)] hover:shadow-sm"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google로 로그인
          </button>

          <button
            type="button"
            onClick={() => signIn("kakao", { callbackUrl: "/" })}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#FEE500] px-4 py-3 text-sm font-medium text-[#191919] transition-all hover:bg-[#FDD800] hover:shadow-sm"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#191919">
              <path d="M12 3C6.48 3 2 6.36 2 10.44c0 2.62 1.75 4.93 4.38 6.24l-1.12 4.1a.3.3 0 00.45.33l4.77-3.14c.49.07 1 .1 1.52.1 5.52 0 10-3.36 10-7.63S17.52 3 12 3z" />
            </svg>
            카카오로 로그인
          </button>
        </div>

        {/* Continue without login */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-text-secondary)]"
          >
            로그인 없이 계속 →
          </Link>
        </div>
      </div>
    </div>
  )
}
