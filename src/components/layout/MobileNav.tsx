"use client"

import { useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import Image from "next/image"
import { cn } from "@/lib/utils/cn"
import { useMarketMode, type MarketMode } from "@/store/market-mode"
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
  TrendingUp,
  Layers,
  MessageCircle,
  Scale,
  FileText,
  Calendar,
  BarChart3,
  PieChart,
  Newspaper,
  LogIn,
  LogOut,
  User,
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

const krNavSections: readonly NavSection[] = [
  {
    items: [
      { href: "/", label: "대시보드", icon: LayoutDashboard },
      { href: "/chat", label: "AI 어시스턴트", icon: MessageCircle },
      { href: "/screener", label: "스크리너", icon: Search },
      { href: "/compare", label: "종목 비교", icon: Scale },
      { href: "/watchlist", label: "관심종목", icon: Star },
      { href: "/events", label: "기업 이벤트", icon: Bell },
      { href: "/earnings", label: "실적 서프라이즈", icon: BarChart3 },
    ],
  },
  {
    title: "My 투자 데이터",
    items: [
      { href: "/reports", label: "데일리 보고서", icon: FileText },
      { href: "/flow", label: "투자자 동향", icon: ArrowLeftRight },
      { href: "/insider", label: "내부자 거래", icon: UserCheck },
      { href: "/dividends", label: "배당", icon: Banknote },
      { href: "/block-holdings", label: "대량보유", icon: Building2 },
    ],
  },
  {
    title: "시장",
    items: [
      { href: "/ranking", label: "랭킹", icon: TrendingUp },
      { href: "/themes", label: "테마", icon: Layers },
      { href: "/sectors", label: "섹터 로테이션", icon: PieChart },
      { href: "/ipo", label: "공모주", icon: Calendar },
      { href: "/macro", label: "매크로", icon: Globe },
      { href: "/valuation", label: "밸류에이션", icon: Grid3X3 },
    ],
  },
]

const usNavSections: readonly NavSection[] = [
  {
    items: [
      { href: "/us-stocks", label: "대시보드", icon: LayoutDashboard },
      { href: "/chat", label: "AI 어시스턴트", icon: MessageCircle },
      { href: "/us-stocks/screener", label: "스크리너", icon: Search },
      { href: "/us-stocks/compare", label: "종목 비교", icon: Scale },
      { href: "/watchlist", label: "관심종목", icon: Star },
      { href: "/us-stocks/earnings", label: "실적 서프라이즈", icon: BarChart3 },
    ],
  },
  {
    title: "투자",
    items: [
      { href: "/us-stocks/reports", label: "데일리 보고서", icon: FileText },
      { href: "/us-stocks/insider", label: "내부자 거래", icon: UserCheck },
      { href: "/us-stocks/dividends", label: "배당", icon: Banknote },
    ],
  },
  {
    title: "시장",
    items: [
      { href: "/us-stocks/ranking", label: "랭킹", icon: TrendingUp },
      { href: "/us-stocks/themes", label: "테마", icon: Layers },
      { href: "/us-stocks/sectors", label: "섹터 로테이션", icon: PieChart },
      { href: "/us-stocks/ipo", label: "IPO", icon: Calendar },
      { href: "/macro", label: "매크로", icon: Globe },
      { href: "/us-stocks/valuation", label: "밸류에이션", icon: Grid3X3 },
    ],
  },
]

/** KR↔US 페이지 매핑: 토글 시 대응 페이지로 이동 */
const KR_TO_US: Record<string, string> = {
  "/": "/us-stocks",
  "/chat": "/chat",
  "/screener": "/us-stocks/screener",
  "/compare": "/us-stocks/compare",
  "/watchlist": "/watchlist",
  "/earnings": "/us-stocks/earnings",
  "/reports": "/us-stocks/reports",
  "/insider": "/us-stocks/insider",
  "/dividends": "/us-stocks/dividends",
  "/ranking": "/us-stocks/ranking",
  "/themes": "/us-stocks/themes",
  "/sectors": "/us-stocks/sectors",
  "/ipo": "/us-stocks/ipo",
  "/macro": "/macro",
  "/valuation": "/us-stocks/valuation",
}

const US_TO_KR: Record<string, string> = Object.fromEntries(
  Object.entries(KR_TO_US).map(([kr, us]) => [us, kr])
)

function resolveCounterpart(pathname: string, target: MarketMode): string {
  if (target === "us") {
    return KR_TO_US[pathname] ?? "/us-stocks"
  }
  return US_TO_KR[pathname] ?? "/"
}

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const { mode, setMode } = useMarketMode()

  const handleSwitch = (target: MarketMode) => {
    if (target === mode) return
    setMode(target)
    const dest = resolveCounterpart(pathname, target)
    router.push(dest)
    setOpen(false)
  }

  const navSections = mode === "kr" ? krNavSections : usNavSections

  const close = useCallback(() => setOpen(false), [])

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
                {navSections.map((section, sIdx) => (
                  <div key={section.title ?? sIdx} style={{ marginBottom: 20 }}>
                    {section.title && (
                      <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
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
                            onClick={close}
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
                      })}
                    </div>
                  </div>
                ))}
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
