"use client"

import { cn } from "@/lib/utils/cn"
import { SidebarNav } from "./SidebarNav"
import { SidebarUser } from "./SidebarUser"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface SidebarProps {
  readonly className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  if (pathname.startsWith("/landing")) return null

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-30 hidden h-screen w-64 flex-col lg:flex",
        "border-r border-[var(--color-border-default)]",
        "bg-white",
        className
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-[var(--color-border-subtle)]">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/20">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-5 w-5 text-white"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            <polyline points="16 7 22 7 22 13" />
          </svg>
        </div>
        <Link href="/" className="font-display text-lg font-bold tracking-tight text-[var(--color-text-primary)]">
          <span className="text-[var(--color-text-muted)]">&gt;koscom</span>{" "}Invest<span className="text-[var(--color-accent-500)]">Hub</span>
        </Link>
      </div>

      <SidebarNav />

      <SidebarUser />

      {/* Footer disclaimer */}
      <div className="mt-auto border-t border-[var(--color-border-subtle)] px-6 py-4">
        <p className="text-[10px] leading-relaxed text-[var(--color-text-muted)]">
          &copy; 2026 Koscom. All rights reserved.
          <br />
          AI 분석은 투자 참고용이며 투자 책임은 본인에게 있습니다.
        </p>
      </div>
    </aside>
  )
}
