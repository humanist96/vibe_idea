import type { Metadata } from "next"
import { DividendLabClient } from "@/components/dividend-lab/DividendLabClient"

export const metadata: Metadata = {
  title: "배당 연구소 - InvestHub",
  description: "배당주 검색, 포트폴리오 설계 & 시뮬레이션. 국내/해외 배당주를 조회하고 AI 기반 진단을 받아보세요.",
}

export default function DividendLabPage() {
  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          배당 연구소
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
          배당주 검색, 포트폴리오 설계 & 시뮬레이션
        </p>
      </div>

      <DividendLabClient />
    </div>
  )
}
