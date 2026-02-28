"use client"

import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { Sparkles, Brain, BarChart3, Shield } from "lucide-react"

const features = [
  {
    icon: Brain,
    title: "AI 분석",
    desc: "기술적/재무/심리 분석을 종합한 1-10 AI 점수",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    icon: BarChart3,
    title: "실시간 시세",
    desc: "KOSPI + KOSDAQ 전종목 실시간 데이터",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: Shield,
    title: "DART 연동",
    desc: "공시 기반 재무제표 및 기업 정보",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
]

export function MarketSummary() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-[var(--color-accent-500)]" />
            AI 시장 요약
          </span>
        </CardTitle>
      </CardHeader>

      <div className="space-y-4">
        {features.map((f) => {
          const Icon = f.icon
          return (
            <div
              key={f.title}
              className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-[var(--color-surface-50)]"
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${f.bg}`}>
                <Icon className={`h-4 w-4 ${f.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  {f.title}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-text-tertiary)]">
                  {f.desc}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 rounded-xl bg-[var(--color-surface-50)] p-3 ring-1 ring-[var(--color-border-subtle)]">
        <p className="text-xs leading-relaxed text-[var(--color-text-tertiary)]">
          개별 종목 페이지에서 &quot;AI 분석&quot; 버튼을 클릭하여 AI 점수를 확인할 수 있습니다.
          분석에는 API 키 설정이 필요합니다.
        </p>
      </div>
    </Card>
  )
}
