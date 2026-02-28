import { cn } from "@/lib/utils/cn"
import { type ButtonHTMLAttributes } from "react"

type Variant = "primary" | "secondary" | "ghost"
type Size = "sm" | "md" | "lg"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: Variant
  readonly size?: Size
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-[var(--color-accent-400)] text-white font-semibold hover:bg-[var(--color-accent-500)] shadow-sm",
  secondary:
    "bg-[var(--color-surface-100)] text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border-default)] hover:bg-[var(--color-surface-200)] hover:text-[var(--color-text-primary)]",
  ghost:
    "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-100)] hover:text-[var(--color-text-primary)]",
}

const sizeStyles: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200",
        "focus-ring",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    />
  )
}
