"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils/cn"
import { useMarketMode, type MarketMode } from "@/store/market-mode"
import { ChevronDown } from "lucide-react"
import {
  krCoreItems,
  krCollapsibleSections,
  usCoreItems,
  usCollapsibleSections,
  resolveCounterpart,
  isNavItemActive,
  type NavItem,
  type NavCollapsibleSection,
} from "@/lib/constants/nav-data"

const STORAGE_KEY = "nav-collapsed-sections"

function getPersistedSections(): Record<string, boolean> {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function persistSections(state: Record<string, boolean>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // storage full or unavailable
  }
}

function MarketToggle({ mode, onSwitch }: { readonly mode: MarketMode; readonly onSwitch: (m: MarketMode) => void }) {
  return (
    <div className="mx-3 mb-2 flex rounded-xl bg-[var(--color-surface-100)] p-1">
      <button
        type="button"
        onClick={() => onSwitch("kr")}
        className={cn(
          "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200",
          mode === "kr"
            ? "bg-white text-[var(--color-text-primary)] shadow-sm"
            : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
        )}
      >
        <span className="text-sm">🇰🇷</span>
        국내
      </button>
      <button
        type="button"
        onClick={() => onSwitch("us")}
        className={cn(
          "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200",
          mode === "us"
            ? "bg-white text-[var(--color-text-primary)] shadow-sm"
            : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
        )}
      >
        <span className="text-sm">🇺🇸</span>
        해외
      </button>
    </div>
  )
}

function NavLink({ item, pathname }: { readonly item: NavItem; readonly pathname: string }) {
  const isActive = isNavItemActive(pathname, item.href)
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-amber-50 text-amber-700 shadow-sm shadow-amber-100"
          : "text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-50)] hover:text-[var(--color-text-primary)]"
      )}
    >
      <Icon
        className={cn(
          "h-[18px] w-[18px] shrink-0",
          isActive ? "text-amber-500" : "text-[var(--color-text-muted)]"
        )}
      />
      {item.label}
    </Link>
  )
}

function CollapsibleSection({
  section,
  pathname,
  expanded,
  onToggle,
}: {
  readonly section: NavCollapsibleSection
  readonly pathname: string
  readonly expanded: boolean
  readonly onToggle: () => void
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="mb-0.5 flex w-full items-center justify-between px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
      >
        {section.title}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform duration-200",
            expanded ? "rotate-0" : "-rotate-90"
          )}
        />
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-in-out",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-0.5">
            {section.items.map((item) => (
              <NavLink key={item.href + item.label} item={item} pathname={pathname} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function SidebarNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { mode, setMode } = useMarketMode()

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => getPersistedSections())

  useEffect(() => {
    if (pathname.startsWith("/us-stocks")) {
      setMode("us")
    }
  }, [pathname, setMode])

  const handleSwitch = (target: MarketMode) => {
    if (target === mode) return
    setMode(target)
    const dest = resolveCounterpart(pathname, target)
    router.push(dest)
  }

  const toggleSection = useCallback((title: string) => {
    setExpandedSections((prev) => {
      const next = { ...prev, [title]: !prev[title] }
      persistSections(next)
      return next
    })
  }, [])

  const coreItems = mode === "kr" ? krCoreItems : usCoreItems
  const collapsibleSections = mode === "kr" ? krCollapsibleSections : usCollapsibleSections

  return (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
      <MarketToggle mode={mode} onSwitch={handleSwitch} />

      {/* Core items - 항상 노출 */}
      <div className="space-y-0.5">
        {coreItems.map((item) => (
          <NavLink key={item.href + item.label} item={item} pathname={pathname} />
        ))}
      </div>

      {/* 구분선 */}
      <div className="mx-3 border-t border-[var(--color-border-default)]" />

      {/* Collapsible sections */}
      <div className="space-y-2">
        {collapsibleSections.map((section) => (
          <CollapsibleSection
            key={section.title}
            section={section}
            pathname={pathname}
            expanded={expandedSections[section.title] !== false}
            onToggle={() => toggleSection(section.title)}
          />
        ))}
      </div>
    </nav>
  )
}
