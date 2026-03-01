"use client"

import { signIn } from "next-auth/react"
import Link from "next/link"
import { useState, type FormEvent } from "react"

type Mode = "login" | "register"

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (mode === "register") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        })

        const data = await res.json()
        if (!res.ok) {
          setError(data.error ?? "회원가입에 실패했습니다")
          setLoading(false)
          return
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError(
          mode === "login"
            ? "이메일 또는 비밀번호가 올바르지 않습니다"
            : "회원가입은 완료되었으나 로그인에 실패했습니다"
        )
        setLoading(false)
        return
      }

      window.location.href = "/"
    } catch {
      setError("서버 오류가 발생했습니다")
      setLoading(false)
    }
  }

  const toggleMode = () => {
    setMode(mode === "login" ? "register" : "login")
    setError("")
  }

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
            {mode === "login"
              ? "로그인하여 데이터를 동기화하세요"
              : "회원가입하고 시작하세요"}
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="mb-6 flex rounded-xl border border-[var(--color-border-default)] overflow-hidden">
          <button
            type="button"
            onClick={() => toggleMode()}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              mode === "login"
                ? "bg-[var(--color-accent-500)] text-white"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            로그인
          </button>
          <button
            type="button"
            onClick={() => toggleMode()}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              mode === "register"
                ? "bg-[var(--color-accent-500)] text-white"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            회원가입
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === "register" && (
            <input
              type="text"
              placeholder="이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-50)] px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] outline-none focus:border-[var(--color-accent-500)] transition-colors"
            />
          )}
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-50)] px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] outline-none focus:border-[var(--color-accent-500)] transition-colors"
          />
          <input
            type="password"
            placeholder="비밀번호 (최소 6자)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-50)] px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] outline-none focus:border-[var(--color-accent-500)] transition-colors"
          />

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 w-full rounded-xl bg-[var(--color-accent-500)] px-4 py-3 text-sm font-medium text-white transition-all hover:bg-[var(--color-accent-600)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? "처리 중..."
              : mode === "login"
                ? "로그인"
                : "회원가입"}
          </button>
        </form>

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
