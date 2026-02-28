"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils/cn"
import { LayoutDashboard, Search, Star, UserCheck } from "lucide-react"

const navItems = [
  { href: "/", label: "대시보드", icon: LayoutDashboard },
  { href: "/screener", label: "스크리너", icon: Search },
  { href: "/watchlist", label: "관심종목", icon: Star },
  { href: "/insider", label: "내부자 거래", icon: UserCheck },
] as const

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {navItems.map((item) => {
        const isActive = pathname === item.href
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-[var(--color-accent-400)]/10 text-[var(--color-accent-300)] shadow-sm shadow-amber-500/5"
                : "text-[var(--color-text-tertiary)] hover:bg-[var(--color-glass-2)] hover:text-[var(--color-text-primary)]"
            )}
          >
            <Icon className={cn("h-[18px] w-[18px]", isActive && "text-[var(--color-accent-400)]")} />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
