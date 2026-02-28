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
        "inline-flex items-center gap-1 font-medium",
        isPositive && "text-green-600",
        isNegative && "text-red-600",
        !isPositive && !isNegative && "text-gray-500",
        className
      )}
    >
      {showIcon && (
        <>
          {isPositive && <TrendingUp className="h-4 w-4" />}
          {isNegative && <TrendingDown className="h-4 w-4" />}
          {!isPositive && !isNegative && <Minus className="h-4 w-4" />}
        </>
      )}
      <span>{formatPercent(changePercent)}</span>
    </span>
  )
}
