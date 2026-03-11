"use client"

import { useState, useEffect, useCallback } from "react"
import { usePortfolioTrackerStore } from "@/store/portfolio-tracker"
import { PortfolioSummaryCards } from "./PortfolioSummaryCards"
import { AssetAllocationChart } from "./AssetAllocationChart"
import { PerformanceChart } from "./PerformanceChart"
import { TransactionHistory } from "./TransactionHistory"
import { DividendSummary } from "./DividendSummary"
import type {
  PortfolioItemLive,
  PortfolioSummary,
  TransactionRecord,
  DividendRecordItem,
} from "@/lib/portfolio/types"

type Tab = "overview" | "transactions" | "dividends"

const TABS: readonly { readonly value: Tab; readonly label: string }[] = [
  { value: "overview", label: "포트폴리오 현황" },
  { value: "transactions", label: "거래 내역" },
  { value: "dividends", label: "배당 수익" },
]

export function PortfolioDashboard() {
  const store = usePortfolioTrackerStore()
  const [allocationMode, setAllocationMode] = useState<"sector" | "market">(
    "sector"
  )
  const [isAddingTx, setIsAddingTx] = useState(false)
  const [isAddingDiv, setIsAddingDiv] = useState(false)

  useEffect(() => {
    async function loadData() {
      store.setLoading(true)
      try {
        const [summaryRes, txRes, divRes] = await Promise.all([
          fetch("/api/user/portfolio/summary"),
          fetch("/api/user/transactions"),
          fetch("/api/user/dividend-records"),
        ])

        const [summaryData, txData, divData] = await Promise.all([
          summaryRes.json(),
          txRes.json(),
          divRes.json(),
        ])

        if (summaryData.success) {
          store.setSummary(summaryData.summary as PortfolioSummary)
          store.setItems(summaryData.items as readonly PortfolioItemLive[])
        }
        if (txData.success) {
          store.setTransactions(
            txData.transactions as readonly TransactionRecord[]
          )
        }
        if (divData.success) {
          store.setDividendRecords(
            divData.records as readonly DividendRecordItem[]
          )
        }
      } catch {
        // Network error, keep empty state
      } finally {
        store.setLoading(false)
      }
    }
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleAddTransaction = useCallback(
    async (tx: {
      readonly ticker: string
      readonly market: "KR" | "US"
      readonly type: "BUY" | "SELL"
      readonly quantity: number
      readonly price: number
      readonly fee: number
      readonly date: string
      readonly note?: string
    }) => {
      setIsAddingTx(true)
      try {
        const res = await fetch("/api/user/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(tx),
        })
        const data = await res.json()
        if (data.success) {
          store.addTransaction(data.transaction as TransactionRecord)
        }
      } catch {
        // Silent fail
      } finally {
        setIsAddingTx(false)
      }
    },
    [store]
  )

  const handleAddDividend = useCallback(
    async (record: {
      readonly ticker: string
      readonly market: "KR" | "US"
      readonly amount: number
      readonly currency: "KRW" | "USD"
      readonly receivedAt: string
    }) => {
      setIsAddingDiv(true)
      try {
        const res = await fetch("/api/user/dividend-records", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(record),
        })
        const data = await res.json()
        if (data.success) {
          store.addDividendRecord(data.record as DividendRecordItem)
        }
      } catch {
        // Silent fail
      } finally {
        setIsAddingDiv(false)
      }
    },
    [store]
  )

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-[var(--color-border)]">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => store.setActiveTab(tab.value)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              store.activeTab === tab.value
                ? "border-b-2 border-[var(--color-brand)] text-[var(--color-brand)]"
                : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {store.activeTab === "overview" && (
        <div className="space-y-6">
          <PortfolioSummaryCards
            summary={store.summary}
            isLoading={store.isLoading}
          />

          {store.items.length > 0 && (
            <>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                      자산 배분
                    </h3>
                    <div className="flex gap-1">
                      {(["sector", "market"] as const).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setAllocationMode(mode)}
                          className={`rounded-lg px-2 py-1 text-xs ${
                            allocationMode === mode
                              ? "bg-[var(--color-brand)] text-white"
                              : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
                          }`}
                        >
                          {mode === "sector" ? "섹터별" : "시장별"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <AssetAllocationChart
                    items={store.items}
                    mode={allocationMode}
                  />
                </div>

                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
                  <h3 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">
                    성과 추이
                  </h3>
                  <PerformanceChart data={[]} />
                </div>
              </div>

              <HoldingsTable items={store.items} />
            </>
          )}

          {!store.isLoading && store.items.length === 0 && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <p className="text-lg font-medium text-[var(--color-text-secondary)]">
                  등록된 포트폴리오가 없습니다
                </p>
                <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
                  종목을 추가하고 거래를 기록하세요
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {store.activeTab === "transactions" && (
        <TransactionHistory
          transactions={store.transactions}
          onAdd={handleAddTransaction}
          isAdding={isAddingTx}
        />
      )}

      {store.activeTab === "dividends" && (
        <DividendSummary
          records={store.dividendRecords}
          onAdd={handleAddDividend}
          isAdding={isAddingDiv}
        />
      )}
    </div>
  )
}

function HoldingsTable({
  items,
}: {
  readonly items: readonly PortfolioItemLive[]
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-card)]">
            <th className="px-4 py-2.5 text-left text-xs font-medium text-[var(--color-text-tertiary)]">
              종목
            </th>
            <th className="px-4 py-2.5 text-right text-xs font-medium text-[var(--color-text-tertiary)]">
              수량
            </th>
            <th className="px-4 py-2.5 text-right text-xs font-medium text-[var(--color-text-tertiary)]">
              평균단가
            </th>
            <th className="px-4 py-2.5 text-right text-xs font-medium text-[var(--color-text-tertiary)]">
              현재가
            </th>
            <th className="px-4 py-2.5 text-right text-xs font-medium text-[var(--color-text-tertiary)]">
              평가금
            </th>
            <th className="px-4 py-2.5 text-right text-xs font-medium text-[var(--color-text-tertiary)]">
              손익
            </th>
            <th className="px-4 py-2.5 text-right text-xs font-medium text-[var(--color-text-tertiary)]">
              수익률
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.ticker}
              className="border-b border-[var(--color-border)] last:border-0"
            >
              <td className="px-4 py-2">
                <span className="font-medium text-[var(--color-text-primary)]">
                  {item.name}
                </span>
                <span className="ml-1 text-xs text-[var(--color-text-tertiary)]">
                  {item.ticker} ({item.market})
                </span>
              </td>
              <td className="px-4 py-2 text-right text-[var(--color-text-primary)]">
                {item.quantity.toLocaleString()}
              </td>
              <td className="px-4 py-2 text-right text-[var(--color-text-secondary)]">
                {item.avgPrice.toLocaleString()}
              </td>
              <td className="px-4 py-2 text-right text-[var(--color-text-primary)]">
                {item.currentPrice.toLocaleString()}
              </td>
              <td className="px-4 py-2 text-right text-[var(--color-text-primary)]">
                {(item.quantity * item.currentPrice).toLocaleString()}
              </td>
              <td
                className="px-4 py-2 text-right"
                style={{
                  color:
                    item.unrealizedPnl > 0
                      ? "var(--color-profit, #ef4444)"
                      : item.unrealizedPnl < 0
                        ? "var(--color-loss, #3b82f6)"
                        : "var(--color-text-secondary)",
                }}
              >
                {item.unrealizedPnl > 0 ? "+" : ""}
                {item.unrealizedPnl.toLocaleString()}
              </td>
              <td
                className="px-4 py-2 text-right font-medium"
                style={{
                  color:
                    item.unrealizedPnlPct > 0
                      ? "var(--color-profit, #ef4444)"
                      : item.unrealizedPnlPct < 0
                        ? "var(--color-loss, #3b82f6)"
                        : "var(--color-text-secondary)",
                }}
              >
                {item.unrealizedPnlPct > 0 ? "+" : ""}
                {item.unrealizedPnlPct.toFixed(2)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
