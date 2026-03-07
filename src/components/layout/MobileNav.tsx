"use client"

import { useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import Image from "next/image"
import { cn } from "@/lib/utils/cn"
import { useMarketMode, type MarketMode } from "@/store/market-mode"
import { Menu, X, ChevronDown, LogIn, LogOut, User } from "lucide-react"
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

function MobileNavLink({
  item,
  pathname,
  onClick,
}: {
  readonly item: NavItem
  readonly pathname: string
  readonly onClick: () => void
}) {
  const isActive = isNavItemActive(pathname, item.href)
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        isActive
          ? "bg-amber-50 text-amber-700"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      <Icon
        className={cn(
          "h-[18px] w-[18px] shrink-0",
          isActive ? "text-amber-500" : "text-slate-400"
        )}
      />
      {item.label}
    </Link>
  )
}

function MobileCollapsibleSection({
  section,
  pathname,
  expanded,
  onToggle,
  onLinkClick,
}: {
  readonly section: NavCollapsibleSection
  readonly pathname: string
  readonly expanded: boolean
  readonly onToggle: () => void
  readonly onLinkClick: () => void
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="mb-0.5 flex w-full items-center justify-between px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
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
              <MobileNavLink
                key={item.href + item.label}
                item={item}
                pathname={pathname}
                onClick={onLinkClick}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const { mode, setMode } = useMarketMode()

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => getPersistedSections())

  const handleSwitch = (target: MarketMode) => {
    if (target === mode) return
    setMode(target)
    const dest = resolveCounterpart(pathname, target)
    router.push(dest)
    setOpen(false)
  }

  const close = useCallback(() => setOpen(false), [])

  const toggleSection = useCallback((title: string) => {
    setExpandedSections((prev) => {
      const next = { ...prev, [title]: !prev[title] }
      persistSections(next)
      return next
    })
  }, [])

  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [open])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  const coreItems = mode === "kr" ? krCoreItems : usCoreItems
  const collapsibleSections = mode === "kr" ? krCollapsibleSections : usCollapsibleSections

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 transition-colors"
        aria-label="메뉴 열기"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open &&
        createPortal(
          <>
            {/* Backdrop */}
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 9998,
                backgroundColor: "rgba(0,0,0,0.3)",
              }}
              onClick={close}
              role="button"
              tabIndex={0}
              aria-label="메뉴 닫기"
              onKeyDown={(e) => e.key === "Escape" && close()}
            />

            {/* Drawer */}
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                bottom: 0,
                zIndex: 9999,
                width: 288,
                display: "flex",
                flexDirection: "column",
                backgroundColor: "#ffffff",
                boxShadow: "4px 0 24px rgba(0,0,0,0.12)",
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  height: 64,
                  paddingLeft: 20,
                  paddingRight: 20,
                  borderBottom: "1px solid #e2e8f0",
                  flexShrink: 0,
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/20">
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
                  <span className="font-display text-lg font-bold text-slate-900">
                    <span className="text-slate-400">&gt;koscom</span>{" "}Invest<span className="text-amber-500">Hub</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={close}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                  aria-label="메뉴 닫기"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Market Toggle */}
              <div style={{ padding: "12px 12px 0" }}>
                <div className="flex rounded-xl bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => handleSwitch("kr")}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200",
                      mode === "kr"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    <span className="text-sm">🇰🇷</span>
                    국내
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitch("us")}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200",
                      mode === "us"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    <span className="text-sm">🇺🇸</span>
                    해외
                  </button>
                </div>
              </div>

              {/* Nav */}
              <nav
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "16px 12px",
                }}
              >
                {/* Core items - 항상 노출 */}
                <div className="space-y-0.5">
                  {coreItems.map((item) => (
                    <MobileNavLink
                      key={item.href + item.label}
                      item={item}
                      pathname={pathname}
                      onClick={close}
                    />
                  ))}
                </div>

                {/* 구분선 */}
                <div className="mx-3 my-3 border-t border-slate-200" />

                {/* Collapsible sections */}
                <div className="space-y-2">
                  {collapsibleSections.map((section) => (
                    <MobileCollapsibleSection
                      key={section.title}
                      section={section}
                      pathname={pathname}
                      expanded={expandedSections[section.title] !== false}
                      onToggle={() => toggleSection(section.title)}
                      onLinkClick={close}
                    />
                  ))}
                </div>
              </nav>

              {/* User section */}
              <div
                style={{
                  flexShrink: 0,
                  borderTop: "1px solid #e2e8f0",
                  padding: "12px 16px",
                }}
              >
                {session ? (
                  <div className="flex items-center gap-3">
                    {session.user.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name ?? "User"}
                        width={32}
                        height={32}
                        className="h-8 w-8 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {session.user.name}
                      </p>
                      <p className="truncate text-[11px] text-slate-400">
                        {session.user.email}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        close()
                        signOut({ callbackUrl: "/" })
                      }}
                      className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                      title="로그아웃"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    onClick={close}
                    className="flex items-center gap-2.5 rounded-xl px-2 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    <LogIn className="h-4 w-4" />
                    로그인
                  </Link>
                )}
              </div>

              {/* Footer */}
              <div
                style={{
                  flexShrink: 0,
                  borderTop: "1px solid #e2e8f0",
                  padding: "16px 20px",
                }}
              >
                <p className="text-[10px] leading-relaxed text-slate-400">
                  &copy; 2026 Koscom. All rights reserved.
                  <br />
                  AI 분석은 투자 참고용이며 투자 책임은 본인에게 있습니다.
                </p>
              </div>
            </div>
          </>,
          document.body
        )}
    </div>
  )
}
