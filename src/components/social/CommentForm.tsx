"use client"

import { useState, useCallback } from "react"

interface CommentFormProps {
  readonly ideaId: string
  readonly onCommentAdded?: (comment: {
    readonly id: string
    readonly content: string
    readonly createdAt: string
    readonly user: {
      readonly id: string
      readonly name: string | null
      readonly image: string | null
    }
  }) => void
}

export function CommentForm({ ideaId, onCommentAdded }: CommentFormProps) {
  const [content, setContent] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const trimmed = content.trim()
      if (!trimmed || submitting) return

      setSubmitting(true)
      setError("")

      try {
        const res = await fetch(`/api/social/ideas/${ideaId}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: trimmed }),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || "댓글 작성에 실패했습니다.")
        }

        const comment = await res.json()
        setContent("")
        onCommentAdded?.(comment)
      } catch (err) {
        setError(err instanceof Error ? err.message : "오류가 발생했습니다.")
      } finally {
        setSubmitting(false)
      }
    },
    [ideaId, content, submitting, onCommentAdded]
  )

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <p
          style={{
            fontSize: "13px",
            color: "var(--color-loss, #ef4444)",
            marginBottom: "8px",
          }}
        >
          {error}
        </p>
      )}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="댓글을 작성하세요..."
        maxLength={2000}
        rows={3}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: "8px",
          border: "1px solid var(--color-border, #e5e7eb)",
          backgroundColor: "var(--color-bg-secondary, #f9fafb)",
          color: "var(--color-text-primary, #111)",
          fontSize: "14px",
          resize: "vertical",
          outline: "none",
          marginBottom: "8px",
        }}
      />
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          style={{
            padding: "8px 20px",
            borderRadius: "6px",
            border: "none",
            backgroundColor: "var(--color-primary, #3b82f6)",
            color: "#ffffff",
            fontWeight: 600,
            fontSize: "13px",
            cursor:
              submitting || !content.trim() ? "not-allowed" : "pointer",
            opacity: submitting || !content.trim() ? 0.5 : 1,
          }}
        >
          {submitting ? "등록 중..." : "댓글 등록"}
        </button>
      </div>
    </form>
  )
}
