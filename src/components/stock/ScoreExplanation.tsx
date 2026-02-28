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

      <p className="text-sm font-medium text-gray-900">{score.keyInsight}</p>

      <p className="text-sm leading-relaxed text-gray-600">{score.summary}</p>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg bg-gray-50 p-2 text-center">
          <p className="text-xs text-gray-500">기술</p>
          <p className="font-semibold">{score.technicalScore.toFixed(1)}</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-2 text-center">
          <p className="text-xs text-gray-500">재무</p>
          <p className="font-semibold">{score.fundamentalScore.toFixed(1)}</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-2 text-center">
          <p className="text-xs text-gray-500">심리</p>
          <p className="font-semibold">{score.sentimentScore.toFixed(1)}</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-2 text-center">
          <p className="text-xs text-gray-500">리스크</p>
          <p className="font-semibold">{score.riskScore.toFixed(1)}</p>
        </div>
      </div>
    </div>
  )
}
