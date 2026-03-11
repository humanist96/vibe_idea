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
  User,
  Home,
} from "lucide-react"
import type { MarketMode } from "@/store/market-mode"

export interface NavItem {
  readonly href: string
  readonly label: string
  readonly icon: React.ComponentType<{ className?: string }>
}

export interface NavCollapsibleSection {
  readonly title: string
  readonly items: readonly NavItem[]
}

// ── KR Core (항상 노출) ──────────────────────────────────
export const krCoreItems: readonly NavItem[] = [
  { href: "/", label: "대시보드", icon: LayoutDashboard },
  { href: "/chat", label: "AI 어시스턴트", icon: MessageCircle },
  { href: "/screener", label: "스크리너", icon: Search },
  { href: "/watchlist", label: "관심종목", icon: Star },
  { href: "/reports", label: "데일리 보고서", icon: FileText },
  { href: "/my", label: "마이페이지", icon: User },
]

// ── KR 접이식 섹션 ───────────────────────────────────────
export const krCollapsibleSections: readonly NavCollapsibleSection[] = [
  {
    title: "분석 도구",
    items: [
      { href: "/compare", label: "종목 비교", icon: Scale },
      { href: "/earnings", label: "실적 서프라이즈", icon: BarChart3 },
      { href: "/events", label: "기업 이벤트", icon: Bell },
    ],
  },
  {
    title: "투자 데이터",
    items: [
      { href: "/flow", label: "투자자 동향", icon: ArrowLeftRight },
      { href: "/insider", label: "내부자 거래", icon: UserCheck },
      { href: "/dividends", label: "배당", icon: Banknote },
      { href: "/dividend-lab", label: "배당 연구소", icon: PieChart },
      { href: "/block-holdings", label: "대량보유", icon: Building2 },
    ],
  },
  {
    title: "시장 분석",
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

// ── US Core (항상 노출) ──────────────────────────────────
export const usCoreItems: readonly NavItem[] = [
  { href: "/us-stocks", label: "대시보드", icon: LayoutDashboard },
  { href: "/chat", label: "AI 어시스턴트", icon: MessageCircle },
  { href: "/us-stocks/screener", label: "스크리너", icon: Search },
  { href: "/watchlist", label: "관심종목", icon: Star },
  { href: "/us-stocks/reports", label: "데일리 보고서", icon: FileText },
  { href: "/my", label: "마이페이지", icon: User },
]

// ── US 접이식 섹션 ───────────────────────────────────────
export const usCollapsibleSections: readonly NavCollapsibleSection[] = [
  {
    title: "분석 도구",
    items: [
      { href: "/us-stocks/compare", label: "종목 비교", icon: Scale },
      { href: "/us-stocks/earnings", label: "실적 서프라이즈", icon: BarChart3 },
      { href: "/us-stocks/events", label: "기업 이벤트", icon: Bell },
    ],
  },
  {
    title: "투자 데이터",
    items: [
      { href: "/us-stocks/flow", label: "투자자 동향", icon: ArrowLeftRight },
      { href: "/us-stocks/insider", label: "내부자 거래", icon: UserCheck },
      { href: "/us-stocks/dividends", label: "배당", icon: Banknote },
      { href: "/dividend-lab", label: "배당 연구소", icon: PieChart },
    ],
  },
  {
    title: "시장 분석",
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

// ── KR↔US 페이지 매핑 ────────────────────────────────────
export const KR_TO_US: Record<string, string> = {
  "/": "/us-stocks",
  "/chat": "/chat",
  "/screener": "/us-stocks/screener",
  "/compare": "/us-stocks/compare",
  "/watchlist": "/watchlist",
  "/earnings": "/us-stocks/earnings",
  "/events": "/us-stocks/events",
  "/reports": "/us-stocks/reports",
  "/flow": "/us-stocks/flow",
  "/insider": "/us-stocks/insider",
  "/dividends": "/us-stocks/dividends",
  "/dividend-lab": "/dividend-lab",
  "/block-holdings": "/us-stocks",
  "/ranking": "/us-stocks/ranking",
  "/themes": "/us-stocks/themes",
  "/sectors": "/us-stocks/sectors",
  "/ipo": "/us-stocks/ipo",
  "/macro": "/macro",
  "/valuation": "/us-stocks/valuation",
  "/my": "/my",
}

export const US_TO_KR: Record<string, string> = Object.fromEntries(
  Object.entries(KR_TO_US).map(([kr, us]) => [us, kr])
)

export function resolveCounterpart(pathname: string, target: MarketMode): string {
  if (target === "us") {
    return KR_TO_US[pathname] ?? "/us-stocks"
  }
  return US_TO_KR[pathname] ?? "/"
}

// ── 모바일 하단 탭바 ─────────────────────────────────────
export interface BottomTab {
  readonly label: string
  readonly icon: React.ComponentType<{ className?: string }>
  readonly krHref: string
  readonly usHref: string
}

export const BOTTOM_TABS: readonly BottomTab[] = [
  { label: "홈", icon: Home, krHref: "/", usHref: "/us-stocks" },
  { label: "AI", icon: MessageCircle, krHref: "/chat", usHref: "/chat" },
  { label: "스크리너", icon: Search, krHref: "/screener", usHref: "/us-stocks/screener" },
  { label: "관심종목", icon: Star, krHref: "/watchlist", usHref: "/watchlist" },
  { label: "MY", icon: User, krHref: "/my", usHref: "/my" },
]

// ── 유틸: isActive 판별 ──────────────────────────────────
export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/" || href === "/us-stocks") {
    return pathname === href
  }
  return pathname === href || pathname.startsWith(href + "/")
}
