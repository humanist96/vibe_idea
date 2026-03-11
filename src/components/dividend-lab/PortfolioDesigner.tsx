"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { useDividendPortfolioStore } from "@/store/dividend-portfolio"
import { PortfolioItemList } from "./PortfolioItemList"
import { SimulationDashboard } from "./SimulationDashboard"
import { MonthlyDividendGrid } from "./MonthlyDividendGrid"
import { DividendGrowthChart } from "./DividendGrowthChart"
import { AIDiagnosisPanel } from "./AIDiagnosisPanel"
import { WhatIfScenario } from "./WhatIfScenario"
import { AIRecommendPanel } from "./AIRecommendPanel"
import { PortfolioSaveLoad } from "./PortfolioSaveLoad"
import { SectorDiversification } from "./SectorDiversification"
import type { DividendSimulation } from "@/lib/dividend/dividend-types"

export function PortfolioDesigner() {
  const { settings, items, setSettings } = useDividendPortfolioStore()
  const [simulation, setSimulation] = useState<DividendSimulation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runSimulation = useCallback(async () => {
    if (items.length === 0) {
      setSimulation(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/dividend-lab/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings, items }),
      })
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`)
      }
      const json = await res.json()
      if (json.success) {
        setSimulation(json.data)
      }
    } catch {
      setError("시뮬레이션에 실패했습니다. 다시 시도해주세요.")
    } finally {
      setLoading(false)
    }
  }, [settings, items])

  useEffect(() => {
    const timer = setTimeout(runSimulation, 500)
    return () => clearTimeout(timer)
  }, [runSimulation])

  return (
    <div className="space-y-4">
      {/* 투자 설정 */}
      <Card className="animate-fade-up stagger-1">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>투자 설정</CardTitle>
            <PortfolioSaveLoad />
          </div>
        </CardHeader>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <SettingInput
            label="투자금 (만원)"
            value={settings.totalAmount}
            onChange={(v) => setSettings({ totalAmount: v })}
            min={1}
            max={10_000_000}
          />
          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
              기간
            </label>
            <select
              value={settings.period}
              onChange={(e) => setSettings({ period: Number(e.target.value) })}
              className="w-full rounded-lg bg-[var(--color-glass-2)] px-3 py-2 text-sm text-[var(--color-text-primary)] ring-1 ring-[var(--color-border-subtle)]"
            >
              {[1, 3, 5, 10, 15, 20].map((y) => (
                <option key={y} value={y}>
                  {y}년
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <label className="mb-1 block text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
              DRIP
            </label>
            <button
              type="button"
              onClick={() => setSettings({ drip: !settings.drip })}
              className={
                "rounded-lg px-4 py-2 text-sm font-medium ring-1 transition-all " +
                (settings.drip
                  ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/30"
                  : "bg-[var(--color-glass-2)] text-[var(--color-text-tertiary)] ring-[var(--color-border-subtle)]")
              }
            >
              {settings.drip ? "ON" : "OFF"}
            </button>
          </div>
          <SettingInput
            label="월적립 (만원)"
            value={settings.monthlyAdd}
            onChange={(v) => setSettings({ monthlyAdd: v })}
            min={0}
            max={10_000_000}
          />
          <SettingInput
            label="배당성장 (%/년)"
            value={settings.dividendGrowthRate}
            onChange={(v) => setSettings({ dividendGrowthRate: v })}
            min={0}
            max={30}
            step={0.5}
          />
        </div>
      </Card>

      {/* 종목 구성 */}
      <Card className="animate-fade-up stagger-2">
        <CardHeader>
          <CardTitle>
            포트폴리오 구성 ({items.length}종목)
          </CardTitle>
        </CardHeader>
        <PortfolioItemList />
      </Card>

      {error && (
        <div className="rounded-md bg-red-500/10 px-4 py-3 text-sm text-red-400 animate-fade-up">
          {error}
          <button
            type="button"
            onClick={runSimulation}
            className="ml-2 underline hover:text-red-300"
          >
            재시도
          </button>
        </div>
      )}

      {/* 시뮬레이션 결과 */}
      {items.length > 0 && (
        <>
          <SimulationDashboard simulation={simulation} loading={loading} />

          {simulation && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card className="animate-fade-up stagger-4">
                <CardHeader>
                  <CardTitle>월별 배당 수령</CardTitle>
                </CardHeader>
                <MonthlyDividendGrid schedule={simulation.monthlySchedule} />
              </Card>

              <Card className="animate-fade-up stagger-5">
                <CardHeader>
                  <CardTitle>배당 성장 시뮬레이션</CardTitle>
                </CardHeader>
                <DividendGrowthChart projection={simulation.yearlyProjection} />
              </Card>
            </div>
          )}

          {simulation && simulation.sectorAllocation && (
            <Card className="animate-fade-up stagger-5">
              <CardHeader>
                <CardTitle>섹터 분산</CardTitle>
              </CardHeader>
              <SectorDiversification
                sectorAllocation={simulation.sectorAllocation}
                items={items}
              />
            </Card>
          )}

          {simulation && (
            <AIDiagnosisPanel simulation={simulation} />
          )}

          {simulation && items.length > 0 && (
            <WhatIfScenario
              simulation={simulation}
              items={items}
              settings={settings}
            />
          )}

          <AIRecommendPanel
            existingTickers={items.map((i) => i.ticker)}
          />
        </>
      )}

      {items.length === 0 && (
        <Card className="animate-fade-up stagger-3">
          <div className="py-12 text-center">
            <p className="text-sm text-[var(--color-text-muted)]">
              스크리너 탭에서 종목을 추가하거나, 아래 버튼으로 검색하세요.
            </p>
            <button
              type="button"
              onClick={() => useDividendPortfolioStore.getState().setActiveTab("screener")}
              className="mt-4 rounded-lg bg-blue-500/10 px-6 py-2.5 text-sm font-medium text-blue-400 ring-1 ring-blue-500/30 hover:bg-blue-500/20 transition-all"
            >
              배당주 검색하기
            </button>
          </div>
        </Card>
      )}
    </div>
  )
}

function SettingInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  readonly label: string
  readonly value: number
  readonly onChange: (v: number) => void
  readonly min: number
  readonly max: number
  readonly step?: number
}) {
  return (
    <div>
      <label className="mb-1 block text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
        {label}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const v = Number(e.target.value)
          if (v >= min && v <= max) onChange(v)
        }}
        min={min}
        max={max}
        step={step}
        className="w-full rounded-lg bg-[var(--color-glass-2)] px-3 py-2 text-sm tabular-nums text-[var(--color-text-primary)] ring-1 ring-[var(--color-border-subtle)] focus:ring-blue-500/50 focus:outline-none"
      />
    </div>
  )
}
