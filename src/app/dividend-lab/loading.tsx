import { Card } from "@/components/ui/Card"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"

export default function DividendLabLoading() {
  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <LoadingSkeleton className="mb-2 h-8 w-40" />
        <LoadingSkeleton className="h-4 w-64" />
      </div>

      <LoadingSkeleton className="h-11 w-full rounded-lg" />

      <Card>
        <div className="space-y-3">
          <LoadingSkeleton className="h-10 w-full" />
          {Array.from({ length: 8 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </Card>
    </div>
  )
}
