import { cn } from "@/lib/utils/cn"
import { type ReactNode } from "react"

type BadgeVariant = "green" | "red" | "yellow" | "gray" | "blue" | "amber"

interface BadgeProps {
  readonly children: ReactNode
  readonly variant?: BadgeVariant
  readonly className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  green: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  red: "bg-red-50 text-red-700 ring-1 ring-red-200",
  yellow: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  gray: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
  blue: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  amber: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
}

export function Badge({ children, variant = "gray", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
