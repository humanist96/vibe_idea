"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils/cn"
import {
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

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
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
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-[var(--color-accent-400)]/10 text-[var(--color-accent-300)] shadow-sm shadow-amber-500/5"
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
  )
}
