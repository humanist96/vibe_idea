import type { Factor } from "@/lib/ai/score-schema"
import { cn } from "@/lib/utils/cn"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface FactorsListProps {
  readonly factors: Factor[]
}

const impactConfig = {
  positive: {
    icon: TrendingUp,
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-100",
  },
  negative: {
    icon: TrendingDown,
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-100",
  },
  neutral: {
    icon: Minus,
    color: "text-gray-600",
    bg: "bg-gray-50",
    border: "border-gray-100",
  },
} as const

export function FactorsList({ factors }: FactorsListProps) {
  const positiveFactors = factors.filter((f) => f.impact === "positive")
  const negativeFactors = factors.filter((f) => f.impact === "negative")
  const neutralFactors = factors.filter((f) => f.impact === "neutral")

  const sorted = [...positiveFactors, ...neutralFactors, ...negativeFactors]

  return (
    <div className="space-y-2">
      {sorted.map((factor, index) => {
        const config = impactConfig[factor.impact]
        const Icon = config.icon
        return (
          <div
            key={index}
            className={cn(
              "flex items-center gap-3 rounded-lg border px-3 py-2",
              config.bg,
              config.border
            )}
          >
            <Icon className={cn("h-4 w-4 shrink-0", config.color)} />
            <span className="flex-1 text-sm text-gray-700">{factor.name}</span>
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    i < factor.strength ? config.color.replace("text-", "bg-") : "bg-gray-200"
                  )}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
