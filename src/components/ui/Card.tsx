import { cn } from "@/lib/utils/cn"
import { type ReactNode } from "react"

interface CardProps {
  readonly children: ReactNode
  readonly className?: string
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        "glass-card p-5",
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: CardProps) {
  return (
    <div className={cn("mb-4 flex items-center justify-between", className)}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className }: CardProps) {
  return (
    <h3
      className={cn(
        "text-xs font-semibold uppercase tracking-widest",
        "text-[var(--color-text-secondary)]",
        className
      )}
    >
      {children}
    </h3>
  )
}
