"use client"

import { useState, useCallback } from "react"
import { Trash2 } from "lucide-react"

interface CommentUser {
  readonly id: string
  readonly name: string | null
  readonly image: string | null
}

interface Comment {
  readonly id: string
  readonly content: string
  readonly createdAt: string
  readonly user: CommentUser
}

interface CommentListProps {
  readonly comments: readonly Comment[]
  readonly currentUserId?: string
  readonly onDeleted?: (commentId: string) => void
}

export function CommentList({
  comments,
  currentUserId,
  onDeleted,
}: CommentListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = useCallback(
    async (commentId: string) => {
      if (!confirm("댓글을 삭제하시겠습니까?")) return
      setDeletingId(commentId)
      try {
        const res = await fetch(`/api/social/comments/${commentId}`, {
          method: "DELETE",
        })
        if (res.ok) {
          onDeleted?.(commentId)
        }
      } catch {
        // Silently fail - comment stays visible
      } finally {
        setDeletingId(null)
      }
    },
    [onDeleted]
  )

  if (comments.length === 0) {
    return (
      <p
        style={{
          fontSize: "14px",
          color: "var(--color-text-tertiary, #999)",
          textAlign: "center",
          padding: "24px 0",
        }}
      >
        아직 댓글이 없습니다.
      </p>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {comments.map((comment) => {
        const isOwner = currentUserId === comment.user.id
        const formattedDate = new Date(comment.createdAt).toLocaleDateString(
          "ko-KR",
          { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
        )

        return (
          <div
            key={comment.id}
            style={{
              padding: "12px 16px",
              borderRadius: "8px",
              backgroundColor: "var(--color-bg-secondary, #f9fafb)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "6px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "13px",
                }}
              >
                <span
                  style={{
                    fontWeight: 600,
                    color: "var(--color-text-primary, #111)",
                  }}
                >
                  {comment.user.name || "익명"}
                </span>
                <span style={{ color: "var(--color-text-tertiary, #999)" }}>
                  {formattedDate}
                </span>
              </div>
              {isOwner && (
                <button
                  onClick={() => handleDelete(comment.id)}
                  disabled={deletingId === comment.id}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--color-text-tertiary, #999)",
                    padding: "2px",
                  }}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            <p
              style={{
                fontSize: "14px",
                color: "var(--color-text-primary, #111)",
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
              }}
            >
              {comment.content}
            </p>
          </div>
        )
      })}
    </div>
  )
}
