"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/Card"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { EmptyWatchlist } from "@/components/ui/EmptyWatchlist"
import { ArrowLeftRight } from "lucide-react"
import { useUSWatchlistStore } from "@/store/us-watchlist"
import { InstitutionalHoldersTable } from "./InstitutionalHoldersTable"
import { SectorFlowChart } from "./SectorFlowChart"

interface HolderRow {
  readonly name: string
  readonly shares: number
  readonly change: number
  readonly changePercent: number
  readonly filingDate: string
}

interface TickerHolding {
  readonly ticker: string
  readonly topHolders: readonly HolderRow[]
  readonly totalInstitutional: number
  readonly institutionalPercent: number
}

interface SectorFlow {
  readonly sector: string
  readonly sectorKr: string
  readonly netChange: number
  readonly tickers: readonly string[]
}

interface FlowData {
  readonly holdings: readonly TickerHolding[]
  readonly sectorFlow: readonly SectorFlow[]
}

export function USFlowClient() {
  const tickers = useUSWatchlistStore((s) => s.tickers)
  const [data, setData] = useState<FlowData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (tickers.length === 0) {
      setLoading(false)
      setData(null)
      return
    }

    async function fetchFlow() {
      setLoading(true)
      setError("")
      try {
        const params = new URLSearchParams({
          tickers: tickers.slice(0, 20).join(","),
        })
        const res = await fetch(`/api/us-stocks/flow?${params.toString()}`)
        const json = await res.json()
        if (json.success) {
          setData(json.data)
        } else {
          setError(json.error ?? "데이터를 불러올 수 없습니다")
          setData(null)
        }
      } catch {
        setError("네트워크 오류가 발생했습니다")
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchFlow()
  }, [tickers])

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          미국 투자자 동향
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
          관심종목의 기관 투자자 보유 현황 (13F 기반)
        </p>
      </div>

      {loading ? (
        <div className="space-y-4 animate-fade-up stagger-2">
          <LoadingSkeleton className="h-72 w-full rounded-lg" />
          <div className="grid gap-4 sm:grid-cols-2">
            <LoadingSkeleton className="h-48 w-full rounded-lg" />
            <LoadingSkeleton className="h-48 w-full rounded-lg" />
          </div>
        </div>
      ) : tickers.length === 0 ? (
        <Card className="animate-fade-up stagger-2">
          <EmptyWatchlist
            title="투자자 동향을 확인하려면 종목을 추가하세요"
            description="관심종목을 등록하면 기관 투자자 보유 현황과 섹터별 자금 흐름을 확인할 수 있습니다."
          />
        </Card>
      ) : error ? (
        <Card className="animate-fade-up stagger-2">
          <div className="flex flex-col items-center py-16">
            <ArrowLeftRight className="mb-4 h-10 w-10 text-[var(--color-text-muted)]" />
            <p className="text-sm text-[var(--color-loss)]">{error}</p>
          </div>
        </Card>
      ) : data ? (
        <>
          {/* Summary stats */}
          <div className="grid gap-4 sm:grid-cols-3 animate-fade-up stagger-2">
            <div className="glass-card rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase text-[var(--color-text-muted)]">
                분석 종목
              </p>
              <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">
                {data.holdings.length}
              </p>
            </div>
            <div className="glass-card rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase text-[var(--color-text-muted)]">
                섹터 수
              </p>
              <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">
                {data.sectorFlow.length}
              </p>
            </div>
            <div className="glass-card rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase text-[var(--color-text-muted)]">
                순유입 섹터
              </p>
              <p className="mt-1 text-2xl font-bold text-[var(--color-gain)]">
                {data.sectorFlow.filter((s) => s.netChange > 0).length}
              </p>
            </div>
          </div>

          {/* Sector flow chart */}
          <SectorFlowChart sectorFlow={data.sectorFlow} />

          {/* Holdings table */}
          <InstitutionalHoldersTable holdings={data.holdings} />
        </>
      ) : null}
    </div>
  )
}
