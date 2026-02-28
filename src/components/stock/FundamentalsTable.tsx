"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"

type TabType = "income" | "balance" | "cashflow"

const tabs: { label: string; value: TabType }[] = [
  { label: "손익계산서", value: "income" },
  { label: "재무상태표", value: "balance" },
  { label: "현금흐름표", value: "cashflow" },
]

interface FundamentalsTableProps {
  readonly ticker: string
}

export function FundamentalsTable({ ticker: _ticker }: FundamentalsTableProps) {
  const [activeTab, setActiveTab] = useState<TabType>("income")

  return (
    <Card>
      <CardHeader>
        <CardTitle>재무제표</CardTitle>
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
      <div className="text-center py-8 text-sm text-gray-400">
        <p>재무제표 데이터를 불러오려면</p>
        <p className="mt-1">
          DART_API_KEY를 .env.local에 설정해주세요.
        </p>
        <p className="mt-2 text-xs">
          {activeTab === "income" && "매출액, 영업이익, 당기순이익 등"}
          {activeTab === "balance" && "자산, 부채, 자본 등"}
          {activeTab === "cashflow" && "영업활동, 투자활동, 재무활동 현금흐름"}
        </p>
      </div>
    </Card>
  )
}
