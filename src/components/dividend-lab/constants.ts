import type { DividendMarket, DividendSafetyGrade } from "@/lib/dividend/dividend-types"

export const GRADE_COLORS: Readonly<Record<DividendSafetyGrade, string>> = {
  "A+": "text-emerald-400",
  A: "text-emerald-400",
  "B+": "text-blue-400",
  B: "text-blue-400",
  C: "text-amber-400",
  D: "text-red-400",
  F: "text-red-500",
}

export const MARKET_BADGE_STYLES: Readonly<Record<DividendMarket, string>> = {
  KR: "bg-blue-500/10 text-blue-400",
  US: "bg-purple-500/10 text-purple-400",
}
