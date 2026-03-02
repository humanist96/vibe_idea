"use client"

import {
  TrendingUp,
  BarChart3,
  BookOpen,
  List,
  type LucideIcon,
} from "lucide-react"

interface QuickAction {
  readonly label: string
  readonly message: string
  readonly icon: LucideIcon
}

const QUICK_ACTIONS: readonly QuickAction[] = [
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
    label: "테마 트렌드",
    message: "요즘 인기 있는 테마 알려줘",
    icon: BarChart3,
  },
  {
    label: "투자 용어 배우기",
    message: "PER과 PBR의 차이를 알려줘",
    icon: BookOpen,
  },
]

interface QuickActionsProps {
  readonly onSelect: (message: string) => void
}

export function QuickActions({ onSelect }: QuickActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {QUICK_ACTIONS.map((action) => (
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
