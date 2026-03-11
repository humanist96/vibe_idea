"use client"

import { useState, useCallback } from "react"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { X, Sparkles, Loader2 } from "lucide-react"

type USEventType = "EARNINGS" | "IPO" | "OTHER"

interface USEventItem {
  readonly id: string
  readonly ticker: string
  readonly company: string
  readonly type: USEventType
  readonly title: string
  readonly eventDate: string
  readonly metadata: Readonly<Record<string, unknown>>
  readonly source: "finnhub"
}

interface EventDetailModalProps {
  readonly event: USEventItem
  readonly onClose: () => void
}

const EVENT_TYPE_BADGE: Readonly<
  Record<USEventType, { readonly variant: "blue" | "green" | "gray"; readonly label: string }>
> = {
  EARNINGS: { variant: "blue", label: "실적 발표" },
  IPO: { variant: "green", label: "IPO" },
  OTHER: { variant: "gray", label: "기타" },
}

function formatNumber(v: unknown): string {
  if (typeof v !== "number" || v === null) return "-"
  if (Math.abs(v) >= 1_000_000_000)
    return `$${(v / 1_000_000_000).toFixed(2)}B`
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  return `$${v.toFixed(2)}`
}

function formatHour(hour: unknown): string {
  if (hour === "bmo") return "장전 (Before Market Open)"
  if (hour === "amc") return "장후 (After Market Close)"
  if (hour === "dmh") return "장중 (During Market Hours)"
  return "-"
}

export function EventDetailModal({ event, onClose }: EventDetailModalProps) {
  const [aiSummary, setAiSummary] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState("")

  const badge = EVENT_TYPE_BADGE[event.type] ?? EVENT_TYPE_BADGE.OTHER
  const meta = event.metadata

  const fetchAiSummary = useCallback(async () => {
    setAiLoading(true)
    setAiError("")
    try {
      const context = buildContext(event)
      const res = await fetch("/api/us-stocks/events/ai-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context }),
      })
      const json = await res.json()
      if (json.success) {
        setAiSummary(json.data.summary)
      } else {
        setAiError(json.error ?? "AI 요약을 생성할 수 없습니다")
      }
    } catch {
      setAiError("네트워크 오류가 발생했습니다")
    } finally {
      setAiLoading(false)
    }
  }, [event])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-[var(--color-border-default)] bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--color-border-subtle)] p-5">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <Badge variant={badge.variant}>{badge.label}</Badge>
              <span className="font-mono text-sm font-bold text-[var(--color-accent-500)]">
                {event.ticker}
              </span>
            </div>
            <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
              {event.title}
            </h3>
            <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
              {event.eventDate}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-100)] hover:text-[var(--color-text-primary)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 p-5">
          {/* Metadata */}
          {event.type === "EARNINGS" && (
            <div className="grid grid-cols-2 gap-3">
              <MetaItem
                label="EPS 추정"
                value={formatNumber(meta.epsEstimate)}
              />
              <MetaItem
                label="EPS 실적"
                value={formatNumber(meta.epsActual)}
              />
              <MetaItem
                label="매출 추정"
                value={formatNumber(meta.revenueEstimate)}
              />
              <MetaItem
                label="매출 실적"
                value={formatNumber(meta.revenueActual)}
              />
              <MetaItem
                label="발표 시간"
                value={formatHour(meta.hour)}
              />
              {meta.quarter != null && meta.year != null ? (
                <MetaItem
                  label="분기"
                  value={`Q${String(meta.quarter)} FY${String(meta.year)}`}
                />
              ) : null}
            </div>
          )}

          {event.type === "IPO" && (
            <div className="grid grid-cols-2 gap-3">
              <MetaItem
                label="공모가"
                value={meta.price ? `$${meta.price}` : "-"}
              />
              <MetaItem
                label="거래소"
                value={String(meta.exchange ?? "-")}
              />
              <MetaItem
                label="공모 주수"
                value={
                  typeof meta.numberOfShares === "number"
                    ? meta.numberOfShares.toLocaleString()
                    : "-"
                }
              />
              <MetaItem
                label="상태"
                value={String(meta.status ?? "-")}
              />
            </div>
          )}

          {/* AI Summary */}
          <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-50)] p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-secondary)]">
                <Sparkles className="h-3.5 w-3.5 text-[var(--color-accent-500)]" />
                AI 분석
              </span>
              {!aiSummary && !aiLoading && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchAiSummary}
                >
                  요약 생성
                </Button>
              )}
            </div>

            {aiLoading ? (
              <div className="flex items-center gap-2 py-4 text-xs text-[var(--color-text-muted)]">
                <Loader2 className="h-4 w-4 animate-spin" />
                AI 분석 생성 중...
              </div>
            ) : aiError ? (
              <p className="py-2 text-xs text-[var(--color-loss)]">
                {aiError}
              </p>
            ) : aiSummary ? (
              <p className="whitespace-pre-wrap text-xs leading-relaxed text-[var(--color-text-secondary)]">
                {aiSummary}
              </p>
            ) : (
              <p className="py-2 text-xs text-[var(--color-text-muted)]">
                버튼을 클릭하여 AI 분석을 생성하세요.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function MetaItem({
  label,
  value,
}: {
  readonly label: string
  readonly value: string
}) {
  return (
    <div className="rounded-lg bg-[var(--color-surface-100)] px-3 py-2">
      <p className="text-[10px] font-semibold uppercase text-[var(--color-text-muted)]">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium tabular-nums text-[var(--color-text-primary)]">
        {value}
      </p>
    </div>
  )
}

function buildContext(event: USEventItem): string {
  const lines = [
    `이벤트: ${event.title}`,
    `종목: ${event.ticker} (${event.company})`,
    `날짜: ${event.eventDate}`,
    `유형: ${event.type}`,
  ]

  const meta = event.metadata
  if (event.type === "EARNINGS") {
    if (meta.epsEstimate) lines.push(`EPS 추정치: $${meta.epsEstimate}`)
    if (meta.epsActual) lines.push(`EPS 실적: $${meta.epsActual}`)
    if (meta.revenueEstimate)
      lines.push(`매출 추정치: $${meta.revenueEstimate}`)
  }

  lines.push(
    "",
    "위 이벤트에 대해 투자자 관점에서 한국어로 간결하게 분석해주세요.",
    "주가에 미칠 영향, 주의할 점, 투자 시사점을 포함해주세요."
  )

  return lines.join("\n")
}
