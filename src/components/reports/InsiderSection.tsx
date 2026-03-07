"use client"

import { UserCheck } from "lucide-react"
import type { InsiderActivity } from "@/lib/api/dart-insider-types"
import type { BlockHolding } from "@/lib/api/dart-block-holdings-types"

interface InsiderSectionProps {
  readonly insider: readonly InsiderActivity[]
  readonly blockHoldings: readonly BlockHolding[]
}

export function InsiderSection({ insider, blockHoldings }: InsiderSectionProps) {
  if (insider.length === 0 && blockHoldings.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <UserCheck className="h-3.5 w-3.5 text-teal-500" />
        <h4 className="text-xs font-bold text-[var(--color-text-primary)]">내부자 & 대량보유 변동</h4>
      </div>

      {insider.length > 0 && (
        <div className="space-y-1">
          {insider.slice(0, 5).map((act) => (
            <div key={act.id} className="flex items-center gap-2 text-xs">
              <span
                className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-medium"
                style={{
                  backgroundColor: act.type === "buy" ? "rgba(220,38,38,0.08)" : "rgba(37,99,235,0.08)",
                  color: act.type === "buy" ? "var(--color-gain)" : "var(--color-loss)",
                }}
              >
                {act.type === "buy" ? "매수" : act.type === "sell" ? "매도" : "기타"}
              </span>
              <span className="text-[var(--color-text-secondary)]">
                {act.name} ({act.position})
              </span>
              <span className="ml-auto tabular-nums text-[var(--color-text-primary)]">
                {act.shares.toLocaleString("ko-KR")}주
              </span>
              <span className="text-[10px] text-[var(--color-text-muted)]">{act.date}</span>
            </div>
          ))}
        </div>
      )}

      {blockHoldings.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">대량보유</p>
          {blockHoldings.slice(0, 3).map((bh, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="text-[var(--color-text-secondary)]">{bh.reporter}</span>
              <span className="ml-auto tabular-nums text-[var(--color-text-primary)]">
                {bh.ratio.toFixed(2)}%
              </span>
              <span
                className="tabular-nums text-[10px]"
                style={{ color: bh.ratioChange >= 0 ? "var(--color-gain)" : "var(--color-loss)" }}
              >
                ({bh.ratioChange >= 0 ? "+" : ""}{bh.ratioChange.toFixed(2)}%p)
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
