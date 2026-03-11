"use client"

import { useState, useCallback } from "react"
import type {
  StrategyDefinition,
  Condition,
  Indicator,
  Operator,
  StrategyTemplate,
} from "@/lib/backtest/types"

const INDICATORS: readonly { readonly value: Indicator; readonly label: string }[] = [
  { value: "RSI", label: "RSI" },
  { value: "MA", label: "이동평균 (MA)" },
  { value: "EMA", label: "지수이평 (EMA)" },
  { value: "MACD", label: "MACD" },
  { value: "MACD_SIGNAL", label: "MACD 시그널" },
  { value: "BB_UPPER", label: "볼린저 상단" },
  { value: "BB_LOWER", label: "볼린저 하단" },
  { value: "PRICE", label: "현재가" },
]

const OPERATORS: readonly { readonly value: Operator; readonly label: string }[] = [
  { value: ">", label: ">" },
  { value: "<", label: "<" },
  { value: ">=", label: ">=" },
  { value: "<=", label: "<=" },
  { value: "crossAbove", label: "상향 돌파" },
  { value: "crossBelow", label: "하향 돌파" },
]

function createEmptyCondition(): Condition {
  return { indicator: "RSI", params: { period: 14 }, operator: "<", value: 30 }
}

interface StrategyBuilderProps {
  readonly templates: readonly StrategyTemplate[]
  readonly onRun: (params: {
    readonly ticker: string
    readonly market: "KR" | "US"
    readonly period: "1y" | "3y" | "5y"
    readonly strategy: StrategyDefinition
  }) => void
  readonly isRunning: boolean
}

export function StrategyBuilder({
  templates,
  onRun,
  isRunning,
}: StrategyBuilderProps) {
  const [ticker, setTicker] = useState("")
  const [market, setMarket] = useState<"KR" | "US">("KR")
  const [period, setPeriod] = useState<"1y" | "3y" | "5y">("1y")
  const [buyConditions, setBuyConditions] = useState<readonly Condition[]>([
    createEmptyCondition(),
  ])
  const [sellConditions, setSellConditions] = useState<readonly Condition[]>([
    { indicator: "RSI", params: { period: 14 }, operator: ">", value: 70 },
  ])
  const [stopLoss, setStopLoss] = useState<string>("-5")
  const [takeProfit, setTakeProfit] = useState<string>("20")

  const handleTemplateSelect = useCallback(
    (template: StrategyTemplate) => {
      setBuyConditions(template.definition.buyConditions)
      setSellConditions(template.definition.sellConditions)
      if (template.definition.stopLoss !== undefined) {
        setStopLoss(String(template.definition.stopLoss))
      }
      if (template.definition.takeProfit !== undefined) {
        setTakeProfit(String(template.definition.takeProfit))
      }
    },
    []
  )

  const updateCondition = useCallback(
    (
      type: "buy" | "sell",
      index: number,
      field: keyof Condition,
      value: string | number
    ) => {
      const setter = type === "buy" ? setBuyConditions : setSellConditions
      setter((prev) =>
        prev.map((c, i) => {
          if (i !== index) return c
          if (field === "indicator") {
            const ind = value as Indicator
            const defaultPeriod =
              ind === "RSI" ? 14 : ind === "MA" || ind === "EMA" ? 20 : 0
            return {
              ...c,
              indicator: ind,
              params: defaultPeriod > 0 ? { period: defaultPeriod } : {},
            }
          }
          if (field === "operator") return { ...c, operator: value as Operator }
          if (field === "value") return { ...c, value: Number(value) }
          if (field === "params")
            return { ...c, params: { ...c.params, period: Number(value) } }
          return c
        })
      )
    },
    []
  )

  const addCondition = useCallback((type: "buy" | "sell") => {
    const setter = type === "buy" ? setBuyConditions : setSellConditions
    setter((prev) => [...prev, createEmptyCondition()])
  }, [])

  const removeCondition = useCallback((type: "buy" | "sell", index: number) => {
    const setter = type === "buy" ? setBuyConditions : setSellConditions
    setter((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleRun = useCallback(() => {
    if (!ticker.trim()) return
    const sl = parseFloat(stopLoss)
    const tp = parseFloat(takeProfit)
    onRun({
      ticker: ticker.trim().toUpperCase(),
      market,
      period,
      strategy: {
        buyConditions,
        sellConditions,
        ...(isFinite(sl) && sl < 0 ? { stopLoss: sl } : {}),
        ...(isFinite(tp) && tp > 0 ? { takeProfit: tp } : {}),
      },
    })
  }, [ticker, market, period, buyConditions, sellConditions, stopLoss, takeProfit, onRun])

  const needsPeriod = (indicator: Indicator) =>
    indicator === "MA" || indicator === "EMA" || indicator === "RSI"

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
        <h3 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">
          템플릿 선택
        </h3>
        <div className="flex flex-wrap gap-2">
          {templates.map((t) => (
            <button
              key={t.name}
              onClick={() => handleTemplateSelect(t)}
              className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
            >
              {t.nameKr}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
        <h3 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">
          종목 & 기간
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            placeholder="종목코드 (예: 005930)"
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-base)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)]"
          />
          <select
            value={market}
            onChange={(e) => setMarket(e.target.value as "KR" | "US")}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-base)] px-3 py-2 text-sm text-[var(--color-text-primary)]"
          >
            <option value="KR">한국</option>
            <option value="US">미국</option>
          </select>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as "1y" | "3y" | "5y")}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-base)] px-3 py-2 text-sm text-[var(--color-text-primary)]"
          >
            <option value="1y">1년</option>
            <option value="3y">3년</option>
            <option value="5y">5년</option>
          </select>
        </div>
      </div>

      {(["buy", "sell"] as const).map((type) => {
        const conditions = type === "buy" ? buyConditions : sellConditions
        return (
          <div
            key={type}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4"
          >
            <h3 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">
              {type === "buy" ? "매수 조건" : "매도 조건"}{" "}
              <span className="font-normal text-[var(--color-text-tertiary)]">
                (AND)
              </span>
            </h3>
            <div className="space-y-2">
              {conditions.map((cond, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <select
                    value={cond.indicator}
                    onChange={(e) =>
                      updateCondition(type, idx, "indicator", e.target.value)
                    }
                    className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-base)] px-2 py-1.5 text-xs text-[var(--color-text-primary)]"
                  >
                    {INDICATORS.map((ind) => (
                      <option key={ind.value} value={ind.value}>
                        {ind.label}
                      </option>
                    ))}
                  </select>
                  {needsPeriod(cond.indicator) && (
                    <input
                      type="number"
                      value={cond.params.period ?? 14}
                      onChange={(e) =>
                        updateCondition(type, idx, "params", e.target.value)
                      }
                      className="w-16 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-base)] px-2 py-1.5 text-xs text-[var(--color-text-primary)]"
                      min={1}
                      max={500}
                    />
                  )}
                  <select
                    value={cond.operator}
                    onChange={(e) =>
                      updateCondition(type, idx, "operator", e.target.value)
                    }
                    className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-base)] px-2 py-1.5 text-xs text-[var(--color-text-primary)]"
                  >
                    {OPERATORS.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={cond.value}
                    onChange={(e) =>
                      updateCondition(type, idx, "value", e.target.value)
                    }
                    className="w-20 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-base)] px-2 py-1.5 text-xs text-[var(--color-text-primary)]"
                  />
                  {conditions.length > 1 && (
                    <button
                      onClick={() => removeCondition(type, idx)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      삭제
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => addCondition(type)}
              className="mt-2 text-xs text-[var(--color-brand)] hover:underline"
            >
              + 조건 추가
            </button>
          </div>
        )
      })}

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
        <h3 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">
          리스크 관리
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-[var(--color-text-tertiary)]">
              손절 (%)
            </label>
            <input
              type="number"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-base)] px-3 py-2 text-sm text-[var(--color-text-primary)]"
              step={1}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--color-text-tertiary)]">
              익절 (%)
            </label>
            <input
              type="number"
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-base)] px-3 py-2 text-sm text-[var(--color-text-primary)]"
              step={1}
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleRun}
        disabled={isRunning || !ticker.trim()}
        className="w-full rounded-xl bg-[var(--color-brand)] px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isRunning ? "백테스트 실행 중..." : "백테스트 실행"}
      </button>
    </div>
  )
}
