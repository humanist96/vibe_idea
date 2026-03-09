"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils/cn"
import { useMarketMode } from "@/store/market-mode"
import { BOTTOM_TABS, isNavItemActive } from "@/lib/constants/nav-data"

export function BottomTabBar() {
  const pathname = usePathname()
  const { mode } = useMarketMode()

  if (pathname.startsWith("/landing")) return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur-sm lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex h-16 items-stretch">
        {BOTTOM_TABS.map((tab) => {
          const href = mode === "kr" ? tab.krHref : tab.usHref
          const isActive = isNavItemActive(pathname, href)
          const Icon = tab.icon

          return (
            <Link
              key={tab.label}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
                isActive
                  ? "text-amber-600"
                  : "text-slate-400 active:text-slate-600"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5",
                  isActive ? "text-amber-500" : "text-slate-400"
                )}
              />
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
