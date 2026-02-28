"use client"

import { cn } from "@/lib/utils/cn"

interface ScoreBadgeProps {
  readonly score: number
  readonly size?: "sm" | "md" | "lg"
  readonly className?: string
}

function getScoreColor(score: number): string {
  if (score >= 7) return "bg-green-500 text-white"
  if (score >= 4) return "bg-yellow-500 text-white"
  return "bg-red-500 text-white"
}

function getScoreRing(score: number): string {
  if (score >= 7) return "ring-green-200"
  if (score >= 4) return "ring-yellow-200"
  return "ring-red-200"
}

const sizeStyles = {
  sm: "w-8 h-8 text-xs",
  md: "w-12 h-12 text-lg",
  lg: "w-16 h-16 text-2xl",
}

export function ScoreBadge({ score, size = "md", className }: ScoreBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full font-bold ring-4",
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
