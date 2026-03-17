"use client"

import { useState, useEffect, useCallback } from "react"
import { z } from "zod"
import { Plus } from "lucide-react"

const ALERT_TYPE_LABELS: Record<string, string> = {
  PRICE_ABOVE: "목표가 이상",
  PRICE_BELOW: "하한가 이하",
  VOLUME_SPIKE: "거래량 급증",
  EARNINGS_DATE: "실적 발표일",
  BREAKOUT_RESISTANCE: "저항선 돌파",
  BREAKDOWN_SUPPORT: "지지선 이탈",
  EARNINGS_SURPRISE: "실적 서프라이즈",
  FOREIGN_BULK_BUY: "외국인 대량 매수",
  INSTITUTION_BULK_BUY: "기관 대량 매수",
}

const THRESHOLD_CONFIG: Record<string, {
  readonly label: string
  readonly placeholder: string
  readonly unit: string
  readonly defaultValue: string
}> = {
  PRICE_ABOVE: { label: "기준가", placeholder: "70000", unit: "KRW", defaultValue: "" },
  PRICE_BELOW: { label: "기준가", placeholder: "70000", unit: "KRW", defaultValue: "" },
  VOLUME_SPIKE: { label: "배수 (기본 2배)", placeholder: "2", unit: "", defaultValue: "" },
  BREAKOUT_RESISTANCE: { label: "저항선 가격", placeholder: "80000", unit: "KRW", defaultValue: "" },
  BREAKDOWN_SUPPORT: { label: "지지선 가격", placeholder: "60000", unit: "KRW", defaultValue: "" },
  EARNINGS_SURPRISE: { label: "서프라이즈 임계값 (%)", placeholder: "10", unit: "%", defaultValue: "10" },
  FOREIGN_BULK_BUY: { label: "순매수 임계값 (억원)", placeholder: "50", unit: "B_KRW", defaultValue: "50" },
  INSTITUTION_BULK_BUY: { label: "순매수 임계값 (억원)", placeholder: "50", unit: "B_KRW", defaultValue: "50" },
}

const TYPES_NEEDING_THRESHOLD = new Set([
  "PRICE_ABOVE",
  "PRICE_BELOW",
  "VOLUME_SPIKE",
  "BREAKOUT_RESISTANCE",
  "BREAKDOWN_SUPPORT",
  "EARNINGS_SURPRISE",
  "FOREIGN_BULK_BUY",
  "INSTITUTION_BULK_BUY",
])

const formSchema = z.object({
  ticker: z.string().min(1, "종목코드를 입력하세요").max(20),
  market: z.enum(["KR", "US"]),
  type: z.enum([
    "PRICE_ABOVE",
    "PRICE_BELOW",
    "VOLUME_SPIKE",
    "EARNINGS_DATE",
    "BREAKOUT_RESISTANCE",
    "BREAKDOWN_SUPPORT",
    "EARNINGS_SURPRISE",
    "FOREIGN_BULK_BUY",
    "INSTITUTION_BULK_BUY",
  ]),
  threshold: z.number().positive("0보다 큰 값을 입력하세요").optional(),
  thresholdUnit: z.string().optional(),
  notes: z.string().max(200).optional(),
})

interface WatchlistItem {
  readonly ticker: string
  readonly market?: string
}

interface AlertRuleFormProps {
  readonly onCreated: () => void
}

export function AlertRuleForm({ onCreated }: AlertRuleFormProps) {
  const [ticker, setTicker] = useState("")
  const [market, setMarket] = useState<"KR" | "US">("KR")
  const [type, setType] = useState<string>("PRICE_ABOVE")
  const [threshold, setThreshold] = useState("")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [watchlist, setWatchlist] = useState<readonly WatchlistItem[]>([])

  useEffect(() => {
    async function fetchWatchlist() {
      try {
        const res = await fetch("/api/user/watchlist")
        if (res.ok) {
          const data = await res.json()
          const items = data.data ?? data.tickers ?? []
          setWatchlist(
            Array.isArray(items)
              ? items.map((t: string | WatchlistItem) =>
                  typeof t === "string" ? { ticker: t } : t
                )
              : []
          )
        }
      } catch {
        // Silently fail
      }
    }
    fetchWatchlist()
  }, [])

  const needsThreshold = TYPES_NEEDING_THRESHOLD.has(type)

  const handleWatchlistSelect = useCallback(
    (item: WatchlistItem) => {
      setTicker(item.ticker)
      if (item.market) {
        setMarket(item.market as "KR" | "US")
      }
      setError(null)
    },
    []
  )

  const handleTypeChange = useCallback((newType: string) => {
    setType(newType)
    const config = THRESHOLD_CONFIG[newType]
    if (config?.defaultValue) {
      setThreshold(config.defaultValue)
    } else {
      setThreshold("")
    }
    setError(null)
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)

      const thresholdConfig = THRESHOLD_CONFIG[type]
      const thresholdUnit = thresholdConfig?.unit || undefined

      const formData = {
        ticker: ticker.trim().toUpperCase(),
        market,
        type,
        threshold: threshold ? parseFloat(threshold) : undefined,
        thresholdUnit: thresholdUnit || undefined,
        notes: notes.trim() || undefined,
      }

      const parsed = formSchema.safeParse(formData)
      if (!parsed.success) {
        setError(parsed.error.errors[0]?.message ?? "입력값을 확인하세요")
        return
      }

      if (needsThreshold && !formData.threshold) {
        setError("기준값을 입력하세요")
        return
      }

      setSubmitting(true)

      try {
        const res = await fetch("/api/user/alert-rules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error ?? "알림 규칙 생성 실패")
        }

        setTicker("")
        setThreshold("")
        setNotes("")
        setType("PRICE_ABOVE")
        onCreated()
      } catch (err) {
        setError(err instanceof Error ? err.message : "알림 규칙 생성 실패")
      } finally {
        setSubmitting(false)
      }
    },
    [ticker, market, type, threshold, notes, needsThreshold, onCreated]
  )

  const thresholdConfig = THRESHOLD_CONFIG[type]

  return (
    <div
      className={
        "rounded-xl border border-[var(--color-border-default)] " +
        "bg-white p-4"
      }
    >
      <h3 className="mb-4 text-sm font-semibold text-[var(--color-text-primary)]">
        알림 규칙 추가
      </h3>

      {watchlist.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
            관심종목에서 선택
          </p>
          <div className="flex flex-wrap gap-1.5">
            {watchlist.slice(0, 10).map((item) => (
              <button
                key={item.ticker}
                type="button"
                onClick={() => handleWatchlistSelect(item)}
                className={
                  "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors " +
                  (ticker === item.ticker
                    ? "bg-[var(--color-accent-500)] text-white"
                    : "bg-[var(--color-surface-100)] text-[var(--color-text-secondary)] " +
                      "hover:bg-[var(--color-surface-200)]")
                }
              >
                {item.ticker}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
              종목코드
            </label>
            <input
              type="text"
              value={ticker}
              onChange={(e) => {
                setTicker(e.target.value)
                setError(null)
              }}
              placeholder="005930"
              className={
                "w-full rounded-lg px-3 py-2 text-sm outline-none " +
                "bg-[var(--color-surface-100)] text-[var(--color-text-primary)] " +
                "ring-1 ring-[var(--color-border-default)] " +
                "placeholder:text-[var(--color-text-muted)] " +
                "focus:ring-[var(--color-accent-400)]"
              }
            />
          </div>
          <div className="w-20">
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
              시장
            </label>
            <select
              value={market}
              onChange={(e) => setMarket(e.target.value as "KR" | "US")}
              className={
                "w-full rounded-lg px-2 py-2 text-sm outline-none " +
                "bg-[var(--color-surface-100)] text-[var(--color-text-primary)] " +
                "ring-1 ring-[var(--color-border-default)] " +
                "focus:ring-[var(--color-accent-400)]"
              }
            >
              <option value="KR">KR</option>
              <option value="US">US</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
            조건
          </label>
          <select
            value={type}
            onChange={(e) => handleTypeChange(e.target.value)}
            className={
              "w-full rounded-lg px-3 py-2 text-sm outline-none " +
              "bg-[var(--color-surface-100)] text-[var(--color-text-primary)] " +
              "ring-1 ring-[var(--color-border-default)] " +
              "focus:ring-[var(--color-accent-400)]"
            }
          >
            {Object.entries(ALERT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {needsThreshold && thresholdConfig && (
          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
              {thresholdConfig.label}
            </label>
            <input
              type="number"
              value={threshold}
              onChange={(e) => {
                setThreshold(e.target.value)
                setError(null)
              }}
              placeholder={thresholdConfig.placeholder}
              step="any"
              min="0"
              className={
                "w-full rounded-lg px-3 py-2 text-sm outline-none " +
                "bg-[var(--color-surface-100)] text-[var(--color-text-primary)] " +
                "ring-1 ring-[var(--color-border-default)] " +
                "placeholder:text-[var(--color-text-muted)] " +
                "focus:ring-[var(--color-accent-400)]"
              }
            />
          </div>
        )}

        <div>
          <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
            메모 (선택)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="예: 52주 신고가 저항선"
            maxLength={200}
            className={
              "w-full rounded-lg px-3 py-2 text-sm outline-none " +
              "bg-[var(--color-surface-100)] text-[var(--color-text-primary)] " +
              "ring-1 ring-[var(--color-border-default)] " +
              "placeholder:text-[var(--color-text-muted)] " +
              "focus:ring-[var(--color-accent-400)]"
            }
          />
        </div>

        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className={
            "flex w-full items-center justify-center gap-2 rounded-lg " +
            "px-4 py-2.5 text-sm font-medium text-white transition-colors " +
            "bg-[var(--color-accent-500)] hover:bg-[var(--color-accent-600)] " +
            "disabled:opacity-50 disabled:cursor-not-allowed"
          }
        >
          <Plus className="h-4 w-4" />
          {submitting ? "추가 중..." : "알림 추가"}
        </button>
      </form>
    </div>
  )
}
