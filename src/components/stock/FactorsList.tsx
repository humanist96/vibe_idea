import type { Factor } from "@/lib/ai/score-schema"
import { cn } from "@/lib/utils/cn"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface FactorsListProps {
  readonly factors: Factor[]
}

const impactConfig = {
  positive: {
    icon: TrendingUp,
    color: "text-[var(--color-danger,#dc2626)]",
    bg: "bg-[var(--color-danger-bg,#fef2f2)]",
    ring: "ring-[var(--color-danger-border,#fecaca)]",
    dotColor: "bg-[var(--color-danger,#ef4444)]",
  },
  negative: {
    icon: TrendingDown,
    color: "text-[var(--color-primary,#2563eb)]",
    bg: "bg-[var(--color-primary-bg,#eff6ff)]",
    ring: "ring-[var(--color-primary-border,#bfdbfe)]",
    dotColor: "bg-[var(--color-primary,#3b82f6)]",
  },
  neutral: {
    icon: Minus,
    color: "text-[var(--color-text-tertiary)]",
    bg: "bg-[var(--color-surface-50)]",
    ring: "ring-[var(--color-border-subtle)]",
    dotColor: "bg-[var(--color-text-muted)]",
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
              "flex items-center gap-3 rounded-xl px-3 py-2 ring-1",
              config.bg,
              config.ring
            )}
          >
            <Icon className={cn("h-4 w-4 shrink-0", config.color)} />
            <span className="flex-1 text-sm text-[var(--color-text-secondary)]">
              {factor.name}
            </span>
            <div className="flex gap-0.5" aria-label={`강도 ${factor.strength}/5`} role="meter" aria-valuenow={factor.strength} aria-valuemin={0} aria-valuemax={5}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    i < factor.strength ? config.dotColor : "bg-[var(--color-surface-200)]"
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
