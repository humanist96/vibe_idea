"use client"

import { Suspense } from "react"
import { Card } from "@/components/ui/Card"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { useDividendPortfolioStore } from "@/store/dividend-portfolio"
import { DividendScreener } from "./DividendScreener"
import { PortfolioDesigner } from "./PortfolioDesigner"
import { DividendCalendar } from "./DividendCalendar"

const TABS = [
  { id: "screener" as const, label: "배당주 스크리너" },
  { id: "designer" as const, label: "포트폴리오 설계" },
  { id: "calendar" as const, label: "배당 캘린더" },
]

function TabContent() {
  const { activeTab } = useDividendPortfolioStore()

  switch (activeTab) {
    case "screener":
      return <DividendScreener />
    case "designer":
      return <PortfolioDesigner />
    case "calendar":
      return <DividendCalendar />
    default: {
      const _exhaustive: never = activeTab
      return null
    }
  }
}

export function DividendLabClient() {
  const { activeTab, setActiveTab } = useDividendPortfolioStore()

  return (
    <>
      <div className="flex gap-1 rounded-lg bg-[var(--color-glass-1)] p-1 animate-fade-up stagger-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={
              "flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-all duration-200 " +
              (activeTab === tab.id
                ? "bg-[var(--color-glass-3)] text-[var(--color-text-primary)] shadow-sm"
                : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]")
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Suspense
        fallback={
          <Card>
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <LoadingSkeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </Card>
        }
      >
        <TabContent />
      </Suspense>
    </>
  )
}
