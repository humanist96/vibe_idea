import { cn } from "@/lib/utils/cn"

interface LoadingSkeletonProps {
  readonly className?: string
  readonly lines?: number
}

export function LoadingSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div className={cn("rounded-lg skeleton-shimmer", className)} />
  )
}

export function CardSkeleton() {
  return (
    <div className="glass-card p-5">
      <LoadingSkeleton className="mb-3 h-3 w-20" />
      <LoadingSkeleton className="mb-2 h-7 w-28" />
      <LoadingSkeleton className="h-3 w-16" />
    </div>
  )
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 py-3">
      <LoadingSkeleton className="h-4 w-6" />
      <LoadingSkeleton className="h-4 w-20" />
      <LoadingSkeleton className="h-4 w-32" />
      <LoadingSkeleton className="h-7 w-7 rounded-full" />
      <LoadingSkeleton className="h-4 w-24" />
      <LoadingSkeleton className="h-4 w-16" />
    </div>
  )
}
