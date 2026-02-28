"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import type { FinancialStatement } from "@/lib/api/dart"

type TabType = "income" | "balance" | "cashflow"

const tabs: { label: string; value: TabType }[] = [
  { label: "손익계산서", value: "income" },
  { label: "재무상태표", value: "balance" },
  { label: "현금흐름표", value: "cashflow" },
]

// DART sj_div code mapping
const TAB_TO_SJ_DIV: Record<TabType, string> = {
  income: "IS",
  balance: "BS",
  cashflow: "CF",
}

// Key accounts to display per tab
const KEY_ACCOUNTS: Record<TabType, readonly string[]> = {
  income: [
    "매출액",
    "매출원가",
    "매출총이익",
    "판매비와관리비",
    "영업이익",
    "법인세비용차감전순이익",
    "당기순이익",
    "기본주당이익",
  ],
  balance: [
    "자산총계",
    "유동자산",
    "비유동자산",
    "부채총계",
    "유동부채",
    "비유동부채",
    "자본총계",
  ],
  cashflow: [
    "영업활동현금흐름",
    "투자활동현금흐름",
    "재무활동현금흐름",
  ],
}

function formatAmount(value: string | undefined): string {
  if (!value || value === "") return "-"
  const num = Number(value.replace(/,/g, ""))
  if (isNaN(num)) return "-"
  const absNum = Math.abs(num)
  const sign = num < 0 ? "-" : ""
  if (absNum >= 1_000_000_000_000) {
    return `${sign}${(absNum / 1_000_000_000_000).toFixed(1)}조`
  }
  if (absNum >= 100_000_000) {
    return `${sign}${(absNum / 100_000_000).toFixed(0)}억`
  }
  if (absNum >= 10_000) {
    return `${sign}${(absNum / 10_000).toFixed(0)}만`
  }
  return num.toLocaleString()
}

function filterStatements(
  statements: readonly FinancialStatement[],
  tab: TabType
): readonly FinancialStatement[] {
  const sjDiv = TAB_TO_SJ_DIV[tab]
  const keyAccounts = KEY_ACCOUNTS[tab]

  const filtered = statements.filter((s) => s.sj_div === sjDiv)

  // Match key accounts in order, dedup by account name
  const result: FinancialStatement[] = []
  const seen = new Set<string>()

  for (const accountName of keyAccounts) {
    const found = filtered.find(
      (s) => s.account_nm === accountName && !seen.has(s.account_nm)
    )
    if (found) {
      seen.add(found.account_nm)
      result.push(found)
    }
  }

  return result
}

interface FundamentalsTableProps {
  readonly ticker: string
}

export function FundamentalsTable({ ticker }: FundamentalsTableProps) {
  const [activeTab, setActiveTab] = useState<TabType>("income")
  const [statements, setStatements] = useState<readonly FinancialStatement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [year, setYear] = useState<number | null>(null)

  useEffect(() => {
    async function fetchFinancials() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/stocks/${ticker}/financials`)
        const json = await res.json()
        if (json.success && json.data.length > 0) {
          setStatements(json.data)
          setYear(json.year ?? null)
        } else {
          setError("재무 데이터가 없습니다.")
        }
      } catch {
        setError("재무 데이터를 불러올 수 없습니다.")
      } finally {
        setLoading(false)
      }
    }

    fetchFinancials()
  }, [ticker])

  const filtered = filterStatements(statements, activeTab)
  const termLabels =
    filtered.length > 0
      ? {
          current: filtered[0].thstrm_nm,
          previous: filtered[0].frmtrm_nm,
          beforePrevious: filtered[0].bfefrmtrm_nm,
        }
      : null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>재무제표{year ? ` (${year}년)` : ""}</CardTitle>
        </div>
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <Button
              key={tab.value}
              variant={activeTab === tab.value ? "primary" : "ghost"}
              size="sm"
              onClick={() => setActiveTab(tab.value)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </CardHeader>

      {loading && (
        <div className="space-y-2 py-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="text-center py-8 text-sm text-gray-400">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-8 text-sm text-gray-400">
          <p>
            {activeTab === "income" && "손익계산서 데이터가 없습니다."}
            {activeTab === "balance" && "재무상태표 데이터가 없습니다."}
            {activeTab === "cashflow" && "현금흐름표 데이터가 없습니다."}
          </p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="py-2 text-left font-medium">항목</th>
                <th className="py-2 text-right font-medium">
                  {termLabels?.current ?? "당기"}
                </th>
                <th className="py-2 text-right font-medium">
                  {termLabels?.previous ?? "전기"}
                </th>
                <th className="py-2 text-right font-medium">
                  {termLabels?.beforePrevious ?? "전전기"}
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr
                  key={item.account_nm}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-2 text-gray-700 font-medium">
                    {item.account_nm}
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {formatAmount(item.thstrm_amount)}
                  </td>
                  <td className="py-2 text-right tabular-nums text-gray-500">
                    {formatAmount(item.frmtrm_amount)}
                  </td>
                  <td className="py-2 text-right tabular-nums text-gray-500">
                    {formatAmount(item.bfefrmtrm_amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="py-2 text-xs text-gray-400 text-right">
            출처: DART 전자공시 (연결재무제표, 단위: 원)
          </p>
        </div>
      )}
    </Card>
  )
}
