"use client"

import { Lightbulb } from "lucide-react"
import type { StockAnalysis } from "@/lib/report/types"

interface MoveReasonsSectionProps {
  readonly analysis: StockAnalysis | undefined
  readonly changePercent: number
  readonly stockName: string
}

const CATEGORY_LABEL: Record<string, string> = {
  supply_demand: "수급",
  news: "뉴스",
  technical: "기술적",
  sector: "업종",
  macro: "매크로",
  event: "공시/이벤트",
}

export function MoveReasonsSection({ analysis, changePercent, stockName }: MoveReasonsSectionProps) {
  const direction = changePercent >= 0 ? "상승" : "하락"

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
        <h4 className="text-xs font-bold text-[var(--color-text-primary)]">등락 원인 분석</h4>
      </div>

      <p className="text-xs text-[var(--color-text-secondary)]">
        어제 {stockName}이(가){" "}
        <span
          className="font-bold"
          style={{ color: changePercent >= 0 ? "var(--color-gain)" : "var(--color-loss)" }}
        >
          {changePercent >= 0 ? "+" : ""}{changePercent.toFixed(2)}% {direction}
        </span>
        한 주요 원인:
      </p>

      {analysis && analysis.moveReasons.length > 0 ? (
        <div className="space-y-2">
          {analysis.moveReasons.map((reason) => (
            <div
              key={reason.rank}
              className="flex gap-3 rounded-lg bg-[var(--color-surface-50)] p-3"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-700">
                {reason.rank}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="rounded bg-[var(--color-surface-100)] px-1.5 py-0.5 text-[9px] font-medium text-[var(--color-text-muted)]">
                    {CATEGORY_LABEL[reason.category] ?? reason.category}
                  </span>
                  <span
                    className="text-[9px] font-medium"
                    style={{ color: reason.impact === "positive" ? "var(--color-gain)" : "var(--color-loss)" }}
                  >
                    {reason.impact === "positive" ? "긍정" : "부정"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[var(--color-text-primary)]">{reason.description}</p>
                <p className="mt-0.5 text-[10px] text-[var(--color-text-muted)]">{reason.evidence}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-[var(--color-text-muted)]">분석 데이터를 수집 중입니다.</p>
      )}

      {analysis?.outlook && (
        <p className="rounded-lg border border-amber-200/50 bg-amber-50/50 p-3 text-xs text-[var(--color-text-secondary)]">
          <span className="font-medium text-amber-700">전망:</span> {analysis.outlook}
        </p>
      )}
    </div>
  )
}
