"use client"

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { LogIn, LogOut, User } from "lucide-react"

export function SidebarUser() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="border-t border-[var(--color-border-subtle)] px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--color-surface-200)]" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-20 animate-pulse rounded bg-[var(--color-surface-200)]" />
            <div className="h-2.5 w-28 animate-pulse rounded bg-[var(--color-surface-200)]" />
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="border-t border-[var(--color-border-subtle)] px-4 py-3">
        <Link
          href="/login"
          className="flex items-center gap-2.5 rounded-xl px-2 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-50)] hover:text-[var(--color-text-primary)]"
        >
          <LogIn className="h-4 w-4" />
          로그인
        </Link>
      </div>
    )
  }

  const user = session.user

  return (
    <div className="border-t border-[var(--color-border-subtle)] px-4 py-3">
      <div className="flex items-center gap-3 rounded-xl px-2 py-1.5">
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name ?? "User"}
            width={32}
            height={32}
            className="h-8 w-8 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-100)] text-[var(--color-accent-600)]">
            <User className="h-4 w-4" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
            {user.name}
          </p>
          <p className="truncate text-[11px] text-[var(--color-text-tertiary)]">
            {user.email}
          </p>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="shrink-0 rounded-lg p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-100)] hover:text-[var(--color-text-primary)]"
          title="로그아웃"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
