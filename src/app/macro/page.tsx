"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/Button"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { Globe } from "lucide-react"
import { IndicatorCard } from "@/components/macro/IndicatorCard"

type Tab = "domestic" | "global"

interface Indicator {
  readonly name: string
  readonly value: number
  readonly prevValue: number
  readonly change: number
  readonly changePercent: number
  readonly unit: string
  readonly date: string
  readonly history: readonly { readonly date: string; readonly value: number }[]
}

export default function MacroPage() {
  const [tab, setTab] = useState<Tab>("domestic")
  const [domestic, setDomestic] = useState<Indicator[]>([])
  const [global, setGlobal] = useState<Indicator[]>([])
  const [loadingDomestic, setLoadingDomestic] = useState(true)
  const [loadingGlobal, setLoadingGlobal] = useState(true)

  useEffect(() => {
    async function fetchDomestic() {
      try {
        const res = await fetch("/api/macro")
        const json = await res.json()
        if (json.success) setDomestic(json.data)
      } catch {
        // silently fail
      } finally {
        setLoadingDomestic(false)
      }
    }

    async function fetchGlobal() {
      try {
        const res = await fetch("/api/macro/global")
        const json = await res.json()
        if (json.success) {
          setGlobal(
            json.data.map((d: { nameKr: string } & Indicator) => ({
              ...d,
              name: d.nameKr ?? d.name,
            }))
          )
        }
      } catch {
        // silently fail
      } finally {
        setLoadingGlobal(false)
      }
    }

    fetchDomestic()
    fetchGlobal()
  }, [])

  const indicators = tab === "domestic" ? domestic : global
  const isLoading = tab === "domestic" ? loadingDomestic : loadingGlobal

  return (
    <div className="space-y-6">
      <div className="animate-fade-up flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            매크로 대시보드
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
            국내외 주요 경제지표 현황
          </p>
        </div>

        <div className="flex gap-1 rounded-lg bg-[var(--color-surface-50)] p-1">
          <Button
            variant={tab === "domestic" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setTab("domestic")}
          >
            <Globe className="mr-1.5 h-3.5 w-3.5" />
            국내
          </Button>
          <Button
            variant={tab === "global" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setTab("global")}
          >
            <Globe className="mr-1.5 h-3.5 w-3.5" />
            글로벌
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 animate-fade-up stagger-2">
          <LoadingSkeleton className="h-40 w-full rounded-xl" />
          <LoadingSkeleton className="h-40 w-full rounded-xl" />
          <LoadingSkeleton className="h-40 w-full rounded-xl" />
          <LoadingSkeleton className="h-40 w-full rounded-xl" />
        </div>
      ) : indicators.length === 0 ? (
        <div className="animate-fade-up stagger-2 glass-card rounded-xl py-12 text-center">
          <p className="text-sm text-[var(--color-text-tertiary)]">
            {tab === "domestic" ? "국내" : "글로벌"} 매크로 데이터를 불러올 수 없습니다
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 animate-fade-up stagger-2">
          {indicators.map((ind) => (
            <IndicatorCard
              key={ind.name}
              name={ind.name}
              value={ind.value}
              change={ind.change}
              changePercent={ind.changePercent}
              unit={ind.unit}
              date={ind.date}
              history={ind.history}
            />
          ))}
        </div>
      )}
    </div>
  )
}
