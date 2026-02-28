"use client"

import { cn } from "@/lib/utils/cn"

interface ScoreBadgeProps {
  readonly score: number
  readonly size?: "sm" | "md" | "lg"
  readonly className?: string
}

function getScoreColor(score: number): string {
  if (score >= 7) return "from-emerald-500 to-emerald-400 shadow-emerald-500/20"
  if (score >= 4) return "from-amber-500 to-yellow-400 shadow-amber-500/20"
  return "from-red-500 to-red-400 shadow-red-500/20"
}

function getScoreRing(score: number): string {
  if (score >= 7) return "ring-emerald-200"
  if (score >= 4) return "ring-amber-200"
  return "ring-red-200"
}

const sizeStyles = {
  sm: "w-8 h-8 text-[10px]",
  md: "w-12 h-12 text-base",
  lg: "w-16 h-16 text-xl",
}

export function ScoreBadge({ score, size = "md", className }: ScoreBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full font-bold text-white",
        "bg-gradient-to-br ring-2 shadow-lg",
        getScoreColor(score),
        getScoreRing(score),
        sizeStyles[size],
        className
      )}
    >
      {score.toFixed(1)}
    </div>
  )
}
