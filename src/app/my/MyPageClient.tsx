"use client"

import { useState, useEffect, useCallback } from "react"
import { usePortfolioStore, type PortfolioItem } from "@/store/portfolio"
import type { QuoteResult } from "@/app/api/user/portfolio/quotes/route"
import { PortfolioSummaryCard } from "@/components/my/PortfolioSummaryCard"
import { HoldingsTable } from "@/components/my/HoldingsTable"
import { HoldingModal } from "@/components/my/HoldingModal"
import { SectorDonutChart } from "@/components/my/SectorDonutChart"
import { WatchlistTodayCard } from "@/components/my/WatchlistTodayCard"
import { RecentAlertsCard } from "@/components/my/RecentAlertsCard"
import { ProfileCard } from "@/components/my/ProfileCard"
import { ActivitySummaryCard } from "@/components/my/ActivitySummaryCard"
import { ScreenerPresetsCard } from "@/components/my/ScreenerPresetsCard"
import { ReportArchiveCard } from "@/components/my/ReportArchiveCard"
import { PortfolioDoctorCard } from "@/components/my/PortfolioDoctorCard"
import { InvestmentJournalCard } from "@/components/my/InvestmentJournalCard"
import { ScenarioSimulatorCard } from "@/components/my/ScenarioSimulatorCard"
import { WeeklyBriefingCard } from "@/components/my/WeeklyBriefingCard"

const REFRESH_INTERVAL = 5 * 60 * 1000

export function MyPageClient() {
  const items = usePortfolioStore((s) => s.items)
  const [quotes, setQuotes] = useState<Record<string, QuoteResult>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null)

  const fetchQuotes = useCallback(async () => {
    if (items.length === 0) {
      setQuotes({})
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch("/api/user/portfolio/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ ticker: i.ticker, market: i.market })),
        }),
      })
      if (res.ok) {
        const json = await res.json()
        if (json.success) {
          setQuotes(json.quotes)
        }
      }
    } catch {
      // silently fail
    } finally {
      setIsLoading(false)
    }
  }, [items])

  useEffect(() => {
    fetchQuotes()
    const timer = setInterval(fetchQuotes, REFRESH_INTERVAL)
    return () => clearInterval(timer)
  }, [fetchQuotes])

  const handleAdd = () => {
    setEditingItem(null)
    setModalOpen(true)
  }

  const handleEdit = (item: PortfolioItem) => {
    setEditingItem(item)
    setModalOpen(true)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="animate-fade-up">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-[var(--color-text-primary)]">
          마이페이지
        </h1>
      </div>

      {/* Portfolio Dashboard */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <div className="space-y-4 sm:space-y-6 lg:col-span-2">
          <PortfolioSummaryCard items={items} quotes={quotes} isLoading={isLoading} />
          <HoldingsTable
            items={items}
            quotes={quotes}
            isLoading={isLoading}
            onAdd={handleAdd}
            onEdit={handleEdit}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4 lg:grid-cols-1 lg:gap-6">
          <SectorDonutChart items={items} quotes={quotes} />
          <WatchlistTodayCard />
          <RecentAlertsCard />
        </div>
      </div>

      {/* AI Portfolio Doctor + Journal */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <PortfolioDoctorCard items={items} quotes={quotes} />
        <InvestmentJournalCard items={items} quotes={quotes} />
      </div>

      {/* Scenario Simulator + Weekly Briefing */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <ScenarioSimulatorCard items={items} quotes={quotes} />
        <WeeklyBriefingCard items={items} quotes={quotes} />
      </div>

      {/* Divider */}
      <div className="border-t border-[var(--color-border)]" />

      {/* Profile & Settings */}
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <ProfileCard />
        <ActivitySummaryCard />
        <ScreenerPresetsCard />
      </div>

      <ReportArchiveCard />

      {modalOpen && (
        <HoldingModal
          editingItem={editingItem}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}
