"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils/cn"
import {
  Menu,
  X,
  LayoutDashboard,
  Search,
  Star,
  ArrowLeftRight,
  UserCheck,
  Banknote,
  Building2,
  Bell,
  Globe,
  Grid3X3,
} from "lucide-react"

interface NavItem {
  readonly href: string
  readonly label: string
  readonly icon: React.ComponentType<{ className?: string }>
}

interface NavSection {
  readonly title?: string
  readonly items: readonly NavItem[]
}

const navSections: readonly NavSection[] = [
  {
    items: [
      { href: "/", label: "대시보드", icon: LayoutDashboard },
      { href: "/screener", label: "스크리너", icon: Search },
      { href: "/watchlist", label: "관심종목", icon: Star },
    ],
  },
  {
    title: "투자 데이터",
    items: [
      { href: "/flow", label: "투자자 동향", icon: ArrowLeftRight },
      { href: "/insider", label: "내부자 거래", icon: UserCheck },
      { href: "/dividends", label: "배당", icon: Banknote },
      { href: "/block-holdings", label: "대량보유", icon: Building2 },
      { href: "/events", label: "기업 이벤트", icon: Bell },
    ],
  },
  {
    title: "시장",
    items: [
      { href: "/macro", label: "매크로", icon: Globe },
      { href: "/valuation", label: "밸류에이션", icon: Grid3X3 },
    ],
  },
]

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-glass-2)]"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
            role="button"
            tabIndex={0}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-72 bg-[var(--color-midnight-900)] border-r border-[var(--color-border-subtle)] p-5">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/20">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-5 w-5 text-midnight-950"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                    <polyline points="16 7 22 7 22 13" />
                  </svg>
                </div>
                <span className="font-display text-lg font-bold text-[var(--color-text-primary)]">
                  KoreaStock<span className="text-[var(--color-accent-400)]">AI</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="space-y-4">
              {navSections.map((section, sIdx) => (
                <div key={section.title ?? sIdx}>
                  {section.title && (
                    <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                      {section.title}
                    </p>
                  )}
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const isActive = pathname === item.href
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
                            isActive
                              ? "bg-[var(--color-accent-400)]/10 text-[var(--color-accent-300)]"
                              : "text-[var(--color-text-tertiary)] hover:bg-[var(--color-glass-2)] hover:text-[var(--color-text-primary)]"
                          )}
                        >
                          <Icon className={cn("h-[18px] w-[18px] shrink-0", isActive && "text-[var(--color-accent-400)]")} />
                          {item.label}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </>
      )}
    </div>
  )
}
