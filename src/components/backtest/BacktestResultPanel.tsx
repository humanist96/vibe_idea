"use client"

import type { BacktestResult } from "@/lib/backtest/types"
import { MetricsGrid } from "./MetricsGrid"
import { SignalChart } from "./SignalChart"
import { TradeLogTable } from "./TradeLogTable"

interface BacktestResultPanelProps {
  readonly result: BacktestResult | null
  readonly isLoading: boolean
}

export function BacktestResultPanel({
  result,
  isLoading,
}: BacktestResultPanelProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-brand)] border-t-transparent" />
          <p className="text-sm text-[var(--color-text-tertiary)]">
            백테스트 실행 중...
          </p>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-lg font-medium text-[var(--color-text-secondary)]">
            전략을 설정하고 백테스트를 실행하세요
          </p>
          <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
            좌측 패널에서 매수/매도 조건을 설정한 후 실행 버튼을 클릭하세요
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <MetricsGrid result={result} />
      <SignalChart result={result} />
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
        <h3 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">
          거래 내역
        </h3>
        <TradeLogTable trades={result.trades} />
      </div>
    </div>
  )
}
