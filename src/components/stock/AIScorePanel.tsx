"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { ScoreGauge } from "@/components/charts/ScoreGauge"
import { RadarChart } from "@/components/charts/RadarChart"
import { ScoreExplanation } from "./ScoreExplanation"
import { FactorsList } from "./FactorsList"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { Sparkles, Newspaper, Clock } from "lucide-react"
import type { AIScore } from "@/lib/ai/score-schema"

interface AIScorePanelProps {
  readonly ticker: string
}

interface DataSourceDotProps {
  readonly label: string
  readonly active: boolean
}

function DataSourceDot({ label, active }: DataSourceDotProps) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`h-2 w-2 rounded-full ${
          active ? "bg-[var(--color-gain)]" : "bg-[var(--color-surface-200)]"
        }`}
      />
      <span className="text-xs text-[var(--color-text-secondary)]">{label}</span>
    </div>
  )
}

function DataSourcesStatus({
  dataSources,
}: {
  readonly dataSources: AIScore["dataSources"]
}) {
  if (!dataSources) return null

  return (
    <div className="rounded-xl bg-[var(--color-surface-50)] p-3 ring-1 ring-[var(--color-border-subtle)]">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
        데이터 소스
      </p>
      <div className="flex flex-wrap gap-3">
        <DataSourceDot label="시세" active={dataSources.quote} />
        <DataSourceDot label="기술적" active={dataSources.technical} />
        <DataSourceDot label="DART" active={dataSources.dart} />
        <DataSourceDot label="재무" active={dataSources.financials} />
        <DataSourceDot label="네이버뉴스" active={dataSources.naverNews} />
        <DataSourceDot label="구글뉴스" active={dataSources.googleNews} />
      </div>
    </div>
  )
}

function NewsHeadlines({
  headlines,
}: {
  readonly headlines: readonly string[]
}) {
  if (headlines.length === 0) return null

  return (
    <div className="rounded-xl bg-[var(--color-surface-50)] p-3 ring-1 ring-[var(--color-border-subtle)]">
      <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
        <Newspaper className="h-3 w-3" />
        최근 뉴스
      </p>
      <ul className="space-y-1.5">
        {headlines.map((headline, i) => (
          <li key={i} className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
            <span className="text-[var(--color-text-muted)] mr-1">{i + 1}.</span>
            {headline}
          </li>
        ))}
      </ul>
    </div>
  )
}

function AnalyzedTime({ analyzedAt }: { readonly analyzedAt?: string }) {
  if (!analyzedAt) return null

  const date = new Date(analyzedAt)
  const timeStr = date.toLocaleString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <p className="flex items-center justify-center gap-1 text-xs text-[var(--color-text-muted)]">
      <Clock className="h-3 w-3" />
      분석 시간: {timeStr}
    </p>
  )
}

export function AIScorePanel({ ticker }: AIScorePanelProps) {
  const [score, setScore] = useState<AIScore | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchScore = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/ai-score/${ticker}`)
      const json = await res.json()
      if (json.success) {
        setScore(json.data)
      } else {
        setError(json.error ?? "분석 실패")
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-[var(--color-accent-500)]" />
            AI 분석
          </span>
        </CardTitle>
      </CardHeader>

      {!score && !loading && (
        <div className="flex flex-col items-center gap-3 py-8">
          <p className="text-sm text-[var(--color-text-tertiary)]">
            AI 분석을 실행하여 종합 점수를 확인하세요
          </p>
          <Button onClick={fetchScore} size="md">
            <Sparkles className="mr-2 h-4 w-4" />
            AI 분석 시작
          </Button>
          {error && <p className="text-sm text-[var(--color-loss)]">{error}</p>}
        </div>
      )}

      {loading && (
        <div className="space-y-4 py-4">
          <div className="flex justify-center">
            <LoadingSkeleton className="h-[120px] w-[120px] rounded-full" />
          </div>
          <LoadingSkeleton className="h-4 w-3/4 mx-auto" />
          <LoadingSkeleton className="h-4 w-1/2 mx-auto" />
          <LoadingSkeleton className="h-[200px] w-full" />
        </div>
      )}

      {score && (
        <div className="space-y-5">
          <div className="flex justify-center">
            <ScoreGauge score={score.aiScore} />
          </div>

          <ScoreExplanation score={score} />

          <RadarChart
            technical={score.technicalScore}
            fundamental={score.fundamentalScore}
            sentiment={score.sentimentScore}
            risk={score.riskScore}
          />

          <div>
            <h4 className="mb-2 text-sm font-semibold text-[var(--color-text-secondary)]">
              주요 요인
            </h4>
            <FactorsList factors={score.factors} />
          </div>

          <DataSourcesStatus dataSources={score.dataSources} />

          {score.newsHeadlines && score.newsHeadlines.length > 0 && (
            <NewsHeadlines headlines={score.newsHeadlines} />
          )}

          <AnalyzedTime analyzedAt={score.analyzedAt} />

          <Button
            variant="ghost"
            size="sm"
            onClick={fetchScore}
            className="w-full"
          >
            재분석
          </Button>
        </div>
      )}
    </Card>
  )
}
