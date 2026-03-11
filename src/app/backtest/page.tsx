"use client"

import { useState, useEffect, useCallback } from "react"
import { StrategyBuilder } from "@/components/backtest/StrategyBuilder"
import { BacktestResultPanel } from "@/components/backtest/BacktestResultPanel"
import type { BacktestResult, StrategyDefinition, StrategyTemplate } from "@/lib/backtest/types"

export default function BacktestPage() {
  const [templates, setTemplates] = useState<readonly StrategyTemplate[]>([])
  const [result, setResult] = useState<BacktestResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadTemplates() {
      try {
        const res = await fetch("/api/backtest/templates")
        const data = await res.json()
        if (data.success) {
          setTemplates(data.templates)
        }
      } catch {
        // Templates are optional, silent fail
      }
    }
    loadTemplates()
  }, [])

  const handleRun = useCallback(
    async (params: {
      readonly ticker: string
      readonly market: "KR" | "US"
      readonly period: "1y" | "3y" | "5y"
      readonly strategy: StrategyDefinition
    }) => {
      setIsRunning(true)
      setError(null)
      setResult(null)

      try {
        const res = await fetch("/api/backtest/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        })
        const data = await res.json()

        if (!data.success) {
          setError(data.error ?? "백테스트 실행에 실패했습니다")
          return
        }
        setResult(data.result)
      } catch {
        setError("네트워크 오류가 발생했습니다")
      } finally {
        setIsRunning(false)
      }
    },
    []
  )

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          백테스트
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
          투자 전략을 과거 데이터로 검증하세요
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <div className="space-y-4">
          <StrategyBuilder
            templates={templates}
            onRun={handleRun}
            isRunning={isRunning}
          />
        </div>
        <div>
          <BacktestResultPanel result={result} isLoading={isRunning} />
        </div>
      </div>
    </div>
  )
}
