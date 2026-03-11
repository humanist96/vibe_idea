"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"

interface IdeaFormProps {
  readonly initialData?: {
    readonly id: string
    readonly ticker: string
    readonly market: string
    readonly direction: string
    readonly title: string
    readonly content: string
    readonly targetPrice: number | null
    readonly horizon: string | null
    readonly isPublic: boolean
  }
}

const HORIZONS = ["단기", "중기", "장기"] as const
const MARKETS = ["KR", "US"] as const
const DIRECTIONS = ["LONG", "SHORT"] as const

export function IdeaForm({ initialData }: IdeaFormProps) {
  const router = useRouter()
  const isEdit = !!initialData

  const [ticker, setTicker] = useState(initialData?.ticker ?? "")
  const [market, setMarket] = useState(initialData?.market ?? "KR")
  const [direction, setDirection] = useState(initialData?.direction ?? "LONG")
  const [title, setTitle] = useState(initialData?.title ?? "")
  const [content, setContent] = useState(initialData?.content ?? "")
  const [targetPrice, setTargetPrice] = useState(
    initialData?.targetPrice?.toString() ?? ""
  )
  const [horizon, setHorizon] = useState(initialData?.horizon ?? "")
  const [isPublic, setIsPublic] = useState(initialData?.isPublic ?? true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (submitting) return
      setSubmitting(true)
      setError("")

      const body = {
        ticker: ticker.toUpperCase().trim(),
        market,
        direction,
        title: title.trim(),
        content: content.trim(),
        ...(targetPrice ? { targetPrice: parseFloat(targetPrice) } : {}),
        ...(horizon ? { horizon } : {}),
        isPublic,
      }

      try {
        const url = isEdit
          ? `/api/social/ideas/${initialData.id}`
          : "/api/social/ideas"
        const res = await fetch(url, {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || "요청에 실패했습니다.")
        }

        const data = await res.json()
        router.push(`/social/ideas/${isEdit ? initialData.id : data.id}`)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "오류가 발생했습니다.")
      } finally {
        setSubmitting(false)
      }
    },
    [
      ticker, market, direction, title, content, targetPrice,
      horizon, isPublic, isEdit, initialData, submitting, router,
    ]
  )

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid var(--color-border, #e5e7eb)",
    backgroundColor: "var(--color-bg-secondary, #f9fafb)",
    color: "var(--color-text-primary, #111)",
    fontSize: "14px",
    outline: "none",
  }

  const labelStyle = {
    display: "block",
    fontSize: "13px",
    fontWeight: 600 as const,
    color: "var(--color-text-secondary, #666)",
    marginBottom: "6px",
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: "640px" }}>
      {error && (
        <div
          style={{
            padding: "12px",
            borderRadius: "8px",
            backgroundColor: "var(--color-loss-bg, #fef2f2)",
            color: "var(--color-loss, #ef4444)",
            fontSize: "14px",
            marginBottom: "16px",
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>종목코드</label>
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            placeholder="AAPL, 005930 등"
            required
            maxLength={20}
            disabled={isEdit}
            style={inputStyle}
          />
        </div>
        <div style={{ width: "100px" }}>
          <label style={labelStyle}>시장</label>
          <select
            value={market}
            onChange={(e) => setMarket(e.target.value)}
            disabled={isEdit}
            style={inputStyle}
          >
            {MARKETS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label style={labelStyle}>방향</label>
        <div style={{ display: "flex", gap: "8px" }}>
          {DIRECTIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDirection(d)}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "8px",
                border:
                  direction === d
                    ? "2px solid"
                    : "1px solid var(--color-border, #e5e7eb)",
                borderColor:
                  direction === d
                    ? d === "LONG"
                      ? "var(--color-profit, #ef4444)"
                      : "var(--color-loss, #3b82f6)"
                    : undefined,
                backgroundColor:
                  direction === d
                    ? d === "LONG"
                      ? "var(--color-profit-bg, #fef2f2)"
                      : "var(--color-loss-bg, #eff6ff)"
                    : "transparent",
                color:
                  direction === d
                    ? d === "LONG"
                      ? "var(--color-profit, #ef4444)"
                      : "var(--color-loss, #3b82f6)"
                    : "var(--color-text-secondary, #666)",
                fontWeight: 600,
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label style={labelStyle}>제목</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="아이디어 제목"
          required
          maxLength={200}
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label style={labelStyle}>내용</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="투자 아이디어를 설명해주세요..."
          required
          maxLength={10000}
          rows={8}
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </div>

      <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>목표가 (선택)</label>
          <input
            type="number"
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            placeholder="목표 가격"
            min={0}
            step="any"
            style={inputStyle}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>투자 기간 (선택)</label>
          <select
            value={horizon}
            onChange={(e) => setHorizon(e.target.value)}
            style={inputStyle}
          >
            <option value="">선택 안함</option>
            {HORIZONS.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "24px",
        }}
      >
        <input
          type="checkbox"
          id="isPublic"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
        />
        <label
          htmlFor="isPublic"
          style={{ fontSize: "14px", color: "var(--color-text-secondary, #666)" }}
        >
          공개 아이디어
        </label>
      </div>

      <button
        type="submit"
        disabled={submitting}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: "8px",
          border: "none",
          backgroundColor: "var(--color-primary, #3b82f6)",
          color: "#ffffff",
          fontWeight: 600,
          fontSize: "15px",
          cursor: submitting ? "not-allowed" : "pointer",
          opacity: submitting ? 0.7 : 1,
        }}
      >
        {submitting ? "저장 중..." : isEdit ? "수정하기" : "아이디어 공유"}
      </button>
    </form>
  )
}
