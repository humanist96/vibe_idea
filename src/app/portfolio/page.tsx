"use client"

import { PortfolioDashboard } from "@/components/portfolio/PortfolioDashboard"

export default function PortfolioPage() {
  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          포트폴리오 트래커
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
          보유 종목 현황, 거래 내역, 배당 수익을 한눈에 관리하세요
        </p>
      </div>

      <PortfolioDashboard />
    </div>
  )
}
