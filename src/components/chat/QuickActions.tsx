"use client"

import {
  TrendingUp,
  BarChart3,
  BookOpen,
  List,
  ArrowUpDown,
  Globe,
  FileText,
  Search,
  Layers,
  TrendingDown,
  DollarSign,
  Zap,
  type LucideIcon,
} from "lucide-react"

interface QuickAction {
  readonly label: string
  readonly message: string
  readonly icon: LucideIcon
}

const KR_QUICK_ACTIONS: readonly QuickAction[] = [
  {
    label: "오늘 시장 요약",
    message: "오늘 시장 현황을 요약해줘",
    icon: TrendingUp,
  },
  {
    label: "관심종목 리뷰",
    message: "내 관심종목 전체 리뷰해줘",
    icon: List,
  },
  {
    label: "등락률 TOP",
    message: "오늘 코스피, 코스닥 상승률·하락률 TOP 종목 알려줘",
    icon: ArrowUpDown,
  },
  {
    label: "인기 테마",
    message: "요즘 인기 있는 테마 알려줘",
    icon: BarChart3,
  },
  {
    label: "섹터 로테이션",
    message: "최근 섹터별 수익률과 로테이션 현황 알려줘",
    icon: Layers,
  },
  {
    label: "공매도 현황",
    message: "최근 공매도 비율이 높은 종목 알려줘",
    icon: TrendingDown,
  },
  {
    label: "경제 지표",
    message: "한국과 글로벌 주요 경제지표 현황 알려줘",
    icon: Globe,
  },
  {
    label: "기업 공시",
    message: "최근 주요 기업 공시 이벤트 알려줘",
    icon: FileText,
  },
  {
    label: "투자 용어",
    message: "PER과 PBR의 차이를 알려줘",
    icon: BookOpen,
  },
]

const US_QUICK_ACTIONS: readonly QuickAction[] = [
  {
    label: "미국 시장 요약",
    message: "미국 시장 현황을 요약해줘",
    icon: TrendingUp,
  },
  {
    label: "AAPL 분석",
    message: "애플 종목 분석해줘",
    icon: Search,
  },
  {
    label: "NVDA 분석",
    message: "엔비디아 최근 현황 알려줘",
    icon: Search,
  },
  {
    label: "TSLA 분석",
    message: "테슬라 주가와 지표 분석해줘",
    icon: Search,
  },
  {
    label: "섹터 ETF 성과",
    message: "미국 섹터 ETF 최근 수익률 비교해줘",
    icon: Layers,
  },
  {
    label: "배당 TOP",
    message: "미국 고배당 우량주 TOP 종목 알려줘",
    icon: DollarSign,
  },
  {
    label: "실적 서프라이즈",
    message: "최근 미국 실적 발표에서 서프라이즈가 큰 종목 알려줘",
    icon: Zap,
  },
  {
    label: "실적 캘린더",
    message: "이번 주 미국 실적 발표 일정 알려줘",
    icon: BarChart3,
  },
  {
    label: "경제 지표",
    message: "미국 주요 경제지표 현황 알려줘",
    icon: Globe,
  },
  {
    label: "투자 용어",
    message: "미국 주식 투자 시 알아야 할 기본 용어 설명해줘",
    icon: BookOpen,
  },
]

interface QuickActionsProps {
  readonly onSelect: (message: string) => void
  readonly marketMode?: "kr" | "us"
}

export function QuickActions({ onSelect, marketMode = "kr" }: QuickActionsProps) {
  const actions = marketMode === "us" ? US_QUICK_ACTIONS : KR_QUICK_ACTIONS

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={() => onSelect(action.message)}
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border-default)] bg-[var(--color-surface-0)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition-all hover:border-[var(--color-accent-400)] hover:text-[var(--color-accent-500)] hover:shadow-sm"
        >
          <action.icon size={14} />
          {action.label}
        </button>
      ))}
    </div>
  )
}
