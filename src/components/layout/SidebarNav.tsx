"use client"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils/cn"
import { useMarketMode, type MarketMode } from "@/store/market-mode"
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
  TrendingUp,
  Layers,
  MessageCircle,
  Scale,
  FileText,
  Calendar,
  BarChart3,
  PieChart,
  Newspaper,
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
      { href: "/my", label: "마이페이지", icon: User },
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
      { href: "/my", label: "마이페이지", icon: User },
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
  "/my": "/my",
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

export function SidebarNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { mode, setMode } = useMarketMode()

  // URL 경로에 따라 자동 모드 전환
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

  const navSections = mode === "kr" ? krNavSections : usNavSections

  return (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
      <MarketToggle mode={mode} onSwitch={handleSwitch} />

      {navSections.map((section, sIdx) => (
        <div key={section.title ?? sIdx}>
          {section.title && (
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
              {section.title}
            </p>
          )}
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const isActive = pathname === item.href
                || (item.href !== "/" && item.href !== "/us-stocks" && pathname.startsWith(item.href + "/"))
                || (item.href === "/" && pathname === "/")
                || (item.href === "/us-stocks" && pathname === "/us-stocks")
              const Icon = item.icon
              return (
                <Link
                  key={item.href + item.label}
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
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}
