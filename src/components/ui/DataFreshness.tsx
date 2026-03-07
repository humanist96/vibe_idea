"use client"

import { cn } from "@/lib/utils/cn"

type FreshnessType = "realtime" | "delayed" | "cached" | "timestamp"

interface DataFreshnessProps {
  readonly type: FreshnessType
  readonly timestamp?: string | Date | null
  readonly className?: string
}

function formatTimestamp(ts: string | Date): string {
  const d = typeof ts === "string" ? new Date(ts) : ts
  const now = new Date()
  const diff = now.getTime() - d.getTime()

  if (diff < 60_000) return "방금 전"
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}분 전`

  return d.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

const TYPE_CONFIG: Record<FreshnessType, { label: string; dotClass: string }> = {
  realtime: {
    label: "실시간",
    dotClass: "bg-[var(--color-gain)] animate-pulse",
  },
  delayed: {
    label: "15분 지연",
    dotClass: "bg-[var(--color-accent-400)]",
  },
  cached: {
    label: "캐시됨",
    dotClass: "bg-[var(--color-text-tertiary)]",
  },
  timestamp: {
    label: "",
    dotClass: "bg-[var(--color-text-tertiary)]",
  },
}

export function DataFreshness({ type, timestamp, className }: DataFreshnessProps) {
  const config = TYPE_CONFIG[type]

  const displayLabel =
    type === "timestamp" && timestamp
      ? `기준: ${formatTimestamp(timestamp)}`
      : config.label

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] text-[var(--color-text-tertiary)]",
        className
      )}
    >
      <span className={cn("inline-block h-1.5 w-1.5 rounded-full", config.dotClass)} />
      {displayLabel}
    </span>
  )
}
