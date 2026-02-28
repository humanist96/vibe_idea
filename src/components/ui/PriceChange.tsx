import { cn } from "@/lib/utils/cn"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { formatPercent } from "@/lib/utils/format"

interface PriceChangeProps {
  readonly change: number
  readonly changePercent: number
  readonly showIcon?: boolean
  readonly className?: string
}

export function PriceChange({
  change,
  changePercent,
  showIcon = true,
  className,
}: PriceChangeProps) {
  const isPositive = change > 0
  const isNegative = change < 0

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium tabular-nums",
        isPositive && "text-[var(--color-gain)]",
        isNegative && "text-[var(--color-loss)]",
        !isPositive && !isNegative && "text-[var(--color-text-tertiary)]",
        className
      )}
    >
      {showIcon && (
        <>
          {isPositive && <TrendingUp className="h-3.5 w-3.5" />}
          {isNegative && <TrendingDown className="h-3.5 w-3.5" />}
          {!isPositive && !isNegative && <Minus className="h-3.5 w-3.5" />}
        </>
      )}
      <span>{formatPercent(changePercent)}</span>
    </span>
  )
}
