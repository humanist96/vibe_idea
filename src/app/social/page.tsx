import type { Metadata } from "next"
import { SocialFeedClient } from "./SocialFeedClient"

export const metadata: Metadata = {
  title: "소셜 피드 - InvestHub",
  description: "팔로우한 투자자들의 최신 아이디어를 확인하세요.",
}

export default function SocialFeedPage() {
  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          소셜 피드
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
          팔로우한 투자자들의 최신 아이디어
        </p>
      </div>

      <SocialFeedClient />
    </div>
  )
}
