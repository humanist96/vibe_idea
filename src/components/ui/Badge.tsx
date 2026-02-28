import { cn } from "@/lib/utils/cn"
import { type ReactNode } from "react"

type BadgeVariant = "green" | "red" | "yellow" | "gray" | "blue"

interface BadgeProps {
  readonly children: ReactNode
  readonly variant?: BadgeVariant
  readonly className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  green: "bg-green-100 text-green-700",
  red: "bg-red-100 text-red-700",
  yellow: "bg-yellow-100 text-yellow-700",
  gray: "bg-gray-100 text-gray-600",
  blue: "bg-blue-100 text-blue-700",
}

export function Badge({ children, variant = "gray", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
