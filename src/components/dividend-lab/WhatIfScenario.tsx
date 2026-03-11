"use client"

import { useState, useMemo } from "react"
import { AlertTriangle, TrendingDown, Percent } from "lucide-react"
import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import type {
  DividendSimulation,
  DividendPortfolioItem,
  DividendPortfolioSettings,
} from "@/lib/dividend/dividend-types"

interface WhatIfScenarioProps {
  readonly simulation: DividendSimulation
  readonly items: readonly DividendPortfolioItem[]
  readonly settings: DividendPortfolioSettings
}

type ScenarioTab = "dividend-cut" | "rate-change"

// ── Pure calculation functions ─────────────────────────

function calcDividendCutImpact(
  items: readonly DividendPortfolioItem[],
  totalAmount: number,
  weightedYield: number,
  targetTicker: string,
  cutPercent: number
) {
  const targetItem = items.find((i) => i.ticker === targetTicker)
  if (!targetItem) return null

  const targetContribution = (targetItem.weight / 100) * weightedYield
  const reducedContribution = targetContribution * (1 - cutPercent / 100)
  const newYield = weightedYield - targetContribution + reducedContribution

  const oldAnnual = totalAmount * 10000 * (weightedYield / 100)
  const newAnnual = totalAmount * 10000 * (newYield / 100)
  const impact = oldAnnual - newAnnual
  const pctChange = weightedYield > 0 ? ((newYield - weightedYield) / weightedYield) * 100 : 0

  return {
    oldYield: weightedYield,
    newYield,
    oldAnnual,
    newAnnual,
    impact,
    pctChange,
  }
}

function calcRateChangeImpact(
  items: readonly DividendPortfolioItem[],
  weightedYield: number,
  totalAmount: number,
  rateChange: number
) {
  // Duration approximation: 1 / yield (higher yield = shorter duration = less sensitive)
  const perStockImpacts = items.map((item) => {
    const stockYield = (item.weight / 100) * weightedYield
    const effectiveYield = stockYield > 0 ? stockYield : 0.01
    const duration = 1 / (effectiveYield / 100)
    const cappedDuration = Math.min(duration, 50)
    const priceChangePct = -(cappedDuration * (rateChange / 100))

    return {
      ticker: item.ticker,
      nameKr: item.nameKr,
      weight: item.weight,
      priceChangePct,
    }
  })

  const totalValueChangePct = perStockImpacts.reduce(
    (sum, s) => sum + (s.weight / 100) * s.priceChangePct,
    0
  )
  const totalValueChangeAmount = totalAmount * 10000 * (totalValueChangePct / 100)

  return { perStockImpacts, totalValueChangePct, totalValueChangeAmount }
}

// ── Format helpers ─────────────────────────

function formatKrw(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 100_000_000) return `${(value / 100_000_000).toFixed(1)}억원`
  if (abs >= 10_000) return `${(value / 10_000).toFixed(0)}만원`
  return `${Math.round(value).toLocaleString()}원`
}

function formatPct(value: number): string {
  const sign = value > 0 ? "+" : ""
  return `${sign}${value.toFixed(2)}%`
}

// ── Component ─────────────────────────

export function WhatIfScenario({ simulation, items, settings }: WhatIfScenarioProps) {
  const [activeTab, setActiveTab] = useState<ScenarioTab>("dividend-cut")
  const [selectedTicker, setSelectedTicker] = useState<string>(items[0]?.ticker ?? "")
  const [cutPercent, setCutPercent] = useState(50)
  const [rateChange, setRateChange] = useState(1)

  const dividendCutResult = useMemo(() => {
    if (!selectedTicker) return null
    return calcDividendCutImpact(
      items,
      settings.totalAmount,
      simulation.summary.weightedYield,
      selectedTicker,
      cutPercent
    )
  }, [items, settings.totalAmount, simulation.summary.weightedYield, selectedTicker, cutPercent])

  const rateChangeResult = useMemo(
    () =>
      calcRateChangeImpact(
        items,
        simulation.summary.weightedYield,
        settings.totalAmount,
        rateChange
      ),
    [items, simulation.summary.weightedYield, settings.totalAmount, rateChange]
  )

  const tabs: readonly { readonly key: ScenarioTab; readonly label: string }[] = [
    { key: "dividend-cut", label: "배당 삭감" },
    { key: "rate-change", label: "금리 변동" },
  ]

  return (
    <Card className="animate-fade-up stagger-5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          <CardTitle>What-if 시나리오</CardTitle>
        </div>
      </CardHeader>

      {/* Tabs */}
      <div className="flex gap-1 px-4 pb-3">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-all " +
              (activeTab === tab.key
                ? "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30"
                : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]")
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="px-4 pb-4">
        {activeTab === "dividend-cut" ? (
          <DividendCutPanel
            items={items}
            selectedTicker={selectedTicker}
            onSelectTicker={setSelectedTicker}
            cutPercent={cutPercent}
            onCutPercentChange={setCutPercent}
            result={dividendCutResult}
          />
        ) : (
          <RateChangePanel
            rateChange={rateChange}
            onRateChange={setRateChange}
            result={rateChangeResult}
          />
        )}
      </div>
    </Card>
  )
}

// ── Sub-panels ─────────────────────────

function DividendCutPanel({
  items,
  selectedTicker,
  onSelectTicker,
  cutPercent,
  onCutPercentChange,
  result,
}: {
  readonly items: readonly DividendPortfolioItem[]
  readonly selectedTicker: string
  readonly onSelectTicker: (t: string) => void
  readonly cutPercent: number
  readonly onCutPercentChange: (v: number) => void
  readonly result: ReturnType<typeof calcDividendCutImpact>
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
            종목 선택
          </label>
          <select
            value={selectedTicker}
            onChange={(e) => onSelectTicker(e.target.value)}
            className="w-full rounded-lg bg-[var(--color-glass-2)] px-3 py-2 text-sm text-[var(--color-text-primary)] ring-1 ring-[var(--color-border-subtle)]"
          >
            {items.map((item) => (
              <option key={`${item.market}:${item.ticker}`} value={item.ticker}>
                {item.nameKr} ({item.ticker})
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
            <TrendingDown className="mr-1 inline h-3 w-3" />
            삭감률: {cutPercent}%
          </label>
          <input
            type="range"
            min={10}
            max={90}
            step={5}
            value={cutPercent}
            onChange={(e) => onCutPercentChange(Number(e.target.value))}
            className="w-full accent-amber-500"
          />
          <div className="flex justify-between text-[10px] text-[var(--color-text-muted)]">
            <span>10%</span>
            <span>90%</span>
          </div>
        </div>
      </div>

      {result && (
        <div className="rounded-lg bg-[var(--color-glass-1)] p-3 ring-1 ring-[var(--color-border-subtle)]">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                기존 수익률
              </span>
              <p className="font-mono text-[var(--color-text-primary)]">
                {result.oldYield.toFixed(2)}%
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                변경 후 수익률
              </span>
              <p className="font-mono text-amber-400">{result.newYield.toFixed(2)}%</p>
            </div>
          </div>
          <div className="mt-3 rounded-md bg-red-500/5 px-3 py-2 text-sm text-red-400">
            연간 배당금 {formatKrw(result.impact)} 감소 ({formatPct(result.pctChange)})
          </div>
        </div>
      )}
    </div>
  )
}

function RateChangePanel({
  rateChange,
  onRateChange,
  result,
}: {
  readonly rateChange: number
  readonly onRateChange: (v: number) => void
  readonly result: ReturnType<typeof calcRateChangeImpact>
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
          <Percent className="mr-1 inline h-3 w-3" />
          금리 변동: {rateChange > 0 ? "+" : ""}
          {rateChange.toFixed(1)}%p
        </label>
        <input
          type="range"
          min={-2}
          max={3}
          step={0.25}
          value={rateChange}
          onChange={(e) => onRateChange(Number(e.target.value))}
          className="w-full accent-amber-500"
        />
        <div className="flex justify-between text-[10px] text-[var(--color-text-muted)]">
          <span>-2%p</span>
          <span>+3%p</span>
        </div>
      </div>

      <div className="rounded-lg bg-[var(--color-glass-1)] p-3 ring-1 ring-[var(--color-border-subtle)]">
        <div className="mb-2 text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
          종목별 예상 가격 변동
        </div>
        <div className="space-y-1.5">
          {result.perStockImpacts.map((stock) => (
            <div
              key={stock.ticker}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-[var(--color-text-secondary)]">
                {stock.nameKr}
              </span>
              <span
                className={
                  "font-mono " +
                  (stock.priceChangePct >= 0 ? "text-emerald-400" : "text-red-400")
                }
              >
                {formatPct(stock.priceChangePct)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between rounded-md bg-[var(--color-glass-2)] px-3 py-2 text-sm">
          <span className="text-[var(--color-text-tertiary)]">포트폴리오 전체</span>
          <span
            className={
              "font-mono font-medium " +
              (result.totalValueChangePct >= 0 ? "text-emerald-400" : "text-red-400")
            }
          >
            {formatPct(result.totalValueChangePct)} ({formatKrw(result.totalValueChangeAmount)})
          </span>
        </div>
      </div>
    </div>
  )
}
