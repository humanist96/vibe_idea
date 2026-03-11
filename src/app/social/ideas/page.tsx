import type { Metadata } from "next"
import { ExploreIdeasClient } from "./ExploreIdeasClient"

export const metadata: Metadata = {
  title: "아이디어 탐색 - InvestHub",
  description: "다양한 투자 아이디어를 탐색하고 인사이트를 얻으세요.",
}

export default function ExploreIdeasPage() {
  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          아이디어 탐색
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
          다양한 투자 아이디어를 탐색하세요
        </p>
      </div>

      <ExploreIdeasClient />
    </div>
  )
}
