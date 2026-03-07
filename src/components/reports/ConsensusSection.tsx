"use client"

import { Target } from "lucide-react"
import { TargetPriceBar } from "./charts/TargetPriceBar"
import type { ConsensusData } from "@/lib/api/naver-consensus"
import type { StockQuote } from "@/lib/api/naver-finance"

interface ConsensusSectionProps {
  readonly consensus: ConsensusData | null
  readonly quote: StockQuote | null
}

export function ConsensusSection({ consensus, quote }: ConsensusSectionProps) {
  if (!consensus || !quote) {
    return (
      <div className="py-2 text-xs text-[var(--color-text-muted)]">컨센서스 데이터 없음</div>
    )
  }

  const { consensus: info } = consensus

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Target className="h-3.5 w-3.5 text-orange-500" />
        <h4 className="text-xs font-bold text-[var(--color-text-primary)]">컨센서스 & 밸류에이션</h4>
      </div>

      <TargetPriceBar
        currentPrice={quote.price}
        targetPrice={info.targetPrice}
      />

      <table className="w-full text-xs">
        <tbody>
          <tr className="border-b border-[var(--color-border-subtle)]">
            <td className="py-1.5 text-[var(--color-text-secondary)]">목표가</td>
            <td className="py-1.5 text-right font-medium text-[var(--color-text-primary)]">
              {info.targetPrice ? `${info.targetPrice.toLocaleString("ko-KR")}원` : "-"}
            </td>
          </tr>
          <tr className="border-b border-[var(--color-border-subtle)]">
            <td className="py-1.5 text-[var(--color-text-secondary)]">투자의견</td>
            <td className="py-1.5 text-right font-medium text-[var(--color-text-primary)]">
              {info.investmentOpinion ?? "-"} (애널리스트 {info.analystCount}명)
            </td>
          </tr>
          <tr className="border-b border-[var(--color-border-subtle)]">
            <td className="py-1.5 text-[var(--color-text-secondary)]">PER</td>
            <td className="py-1.5 text-right tabular-nums font-medium text-[var(--color-text-primary)]">
              {quote.per?.toFixed(2) ?? "-"}x
            </td>
          </tr>
          <tr>
            <td className="py-1.5 text-[var(--color-text-secondary)]">PBR</td>
            <td className="py-1.5 text-right tabular-nums font-medium text-[var(--color-text-primary)]">
              {quote.pbr?.toFixed(2) ?? "-"}x
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
