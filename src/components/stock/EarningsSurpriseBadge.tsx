"use client"

import { cn } from "@/lib/utils/cn"

interface EarningsSurpriseBadgeProps {
  readonly verdict: "beat" | "inline" | "miss"
  readonly surprisePercent: number
}

export function EarningsSurpriseBadge({
  verdict,
  surprisePercent,
}: EarningsSurpriseBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums",
        verdict === "beat" && "bg-[var(--color-gain-soft)] text-[var(--color-gain)]",
        verdict === "miss" && "bg-[var(--color-loss-soft)] text-[var(--color-loss)]",
        verdict === "inline" && "bg-[var(--color-surface-100)] text-[var(--color-text-tertiary)]"
      )}
    >
      {verdict === "beat" && "Beat"}
      {verdict === "miss" && "Miss"}
      {verdict === "inline" && "Inline"}
      {" "}
      {surprisePercent >= 0 ? "+" : ""}
      {surprisePercent.toFixed(1)}%
    </span>
  )
}
