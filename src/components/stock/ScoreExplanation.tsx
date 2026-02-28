import type { AIScore } from "@/lib/ai/score-schema"
import { getRatingColor, getRatingBadgeVariant } from "@/lib/ai/score-schema"
import { Badge } from "@/components/ui/Badge"

interface ScoreExplanationProps {
  readonly score: AIScore
}

export function ScoreExplanation({ score }: ScoreExplanationProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Badge variant={getRatingBadgeVariant(score.rating)}>
          {score.rating}
        </Badge>
        <span className={`text-sm font-semibold ${getRatingColor(score.rating)}`}>
          초과수익 확률 {score.probability}%
        </span>
      </div>

      <p className="text-sm font-medium text-[var(--color-text-primary)]">
        {score.keyInsight}
      </p>

      <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
        {score.summary}
      </p>

      <div className="grid grid-cols-2 gap-2 text-sm">
        {[
          { label: "기술", value: score.technicalScore },
          { label: "재무", value: score.fundamentalScore },
          { label: "심리", value: score.sentimentScore },
          { label: "리스크", value: score.riskScore },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl bg-[var(--color-surface-50)] p-2.5 text-center ring-1 ring-[var(--color-border-subtle)]"
          >
            <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
              {item.label}
            </p>
            <p className="mt-0.5 font-semibold tabular-nums text-[var(--color-text-primary)]">
              {item.value.toFixed(1)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
