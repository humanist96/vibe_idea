import type { Metadata } from "next"
import { LeaderboardTable } from "@/components/social/LeaderboardTable"

export const metadata: Metadata = {
  title: "리더보드 - InvestHub",
  description: "투자 커뮤니티의 상위 투자자들을 확인하세요.",
}

export default function LeaderboardPage() {
  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          리더보드
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
          투자 커뮤니티의 상위 투자자들
        </p>
      </div>

      <LeaderboardTable />
    </div>
  )
}
