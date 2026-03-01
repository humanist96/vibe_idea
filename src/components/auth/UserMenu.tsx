"use client"

import { useState, useRef, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { LogOut, User } from "lucide-react"

export function UserMenu() {
  const { data: session, status } = useSession()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  if (status === "loading") {
    return (
      <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--color-surface-200)]" />
    )
  }

  if (!session) {
    return (
      <Link
        href="/login"
        className="rounded-xl px-3 py-1.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-100)] hover:text-[var(--color-text-primary)]"
      >
        로그인
      </Link>
    )
  }

  const user = session.user

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full ring-2 ring-transparent transition-all hover:ring-[var(--color-accent-400)]"
      >
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name ?? "User"}
            width={32}
            height={32}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent-100)] text-[var(--color-accent-600)]">
            <User className="h-4 w-4" />
          </div>
        )}
      </button>

      {open && (
        <div
          className={
            "absolute right-0 top-full mt-2 w-56 rounded-xl overflow-hidden " +
            "border border-[var(--color-border-default)] " +
            "bg-white shadow-lg shadow-black/8 animate-fade-in"
          }
        >
          <div className="border-b border-[var(--color-border-subtle)] px-4 py-3">
            <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
              {user.name}
            </p>
            <p className="truncate text-xs text-[var(--color-text-tertiary)]">
              {user.email}
            </p>
          </div>

          <div className="p-1.5">
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                signOut({ callbackUrl: "/" })
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-50)] hover:text-[var(--color-text-primary)]"
            >
              <LogOut className="h-4 w-4" />
              로그아웃
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
