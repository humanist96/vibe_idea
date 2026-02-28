import { cn } from "@/lib/utils/cn"

interface LoadingSkeletonProps {
  readonly className?: string
  readonly lines?: number
}

export function LoadingSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div className={cn("animate-pulse rounded-md bg-gray-200", className)} />
  )
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <LoadingSkeleton className="mb-3 h-4 w-24" />
      <LoadingSkeleton className="mb-2 h-8 w-32" />
      <LoadingSkeleton className="h-4 w-20" />
    </div>
  )
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 py-3">
      <LoadingSkeleton className="h-4 w-8" />
      <LoadingSkeleton className="h-4 w-20" />
      <LoadingSkeleton className="h-4 w-32" />
      <LoadingSkeleton className="h-8 w-8 rounded-full" />
      <LoadingSkeleton className="h-4 w-24" />
      <LoadingSkeleton className="h-4 w-16" />
    </div>
  )
}
