"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Heart, Eye, ArrowLeft, Pencil, Trash2 } from "lucide-react"
import Link from "next/link"
import { FollowButton } from "./FollowButton"

interface IdeaDetailUser {
  readonly id: string
  readonly name: string | null
  readonly image: string | null
}

interface IdeaDetailProps {
  readonly id: string
  readonly ticker: string
  readonly market: string
  readonly direction: string
  readonly title: string
  readonly content: string
  readonly targetPrice: number | null
  readonly horizon: string | null
  readonly viewCount: number
  readonly createdAt: string
  readonly updatedAt: string
  readonly user: IdeaDetailUser
  readonly _count: { readonly likes: number; readonly comments: number }
  readonly liked: boolean
  readonly isOwner: boolean
}

export function IdeaDetail({
  id,
  ticker,
  market,
  direction,
  title,
  content,
  targetPrice,
  horizon,
  viewCount,
  createdAt,
  user,
  _count,
  liked: initialLiked,
  isOwner,
}: IdeaDetailProps) {
  const router = useRouter()
  const [liked, setLiked] = useState(initialLiked)
  const [likeCount, setLikeCount] = useState(_count.likes)
  const [isLiking, setIsLiking] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const directionColor =
    direction === "LONG"
      ? "var(--color-profit, #ef4444)"
      : "var(--color-loss, #3b82f6)"

  const handleLike = useCallback(async () => {
    if (isLiking) return
    setIsLiking(true)
    setLiked((prev) => !prev)
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1))

    try {
      const res = await fetch(`/api/social/ideas/${id}/like`, {
        method: "POST",
      })
      if (!res.ok) {
        setLiked((prev) => !prev)
        setLikeCount((prev) => (liked ? prev + 1 : prev - 1))
      }
    } catch {
      setLiked((prev) => !prev)
      setLikeCount((prev) => (liked ? prev + 1 : prev - 1))
    } finally {
      setIsLiking(false)
    }
  }, [id, liked, isLiking])

  const handleDelete = useCallback(async () => {
    if (!confirm("정말 삭제하시겠습니까?")) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/social/ideas/${id}`, { method: "DELETE" })
      if (res.ok) {
        router.push("/social/ideas")
        router.refresh()
      }
    } catch {
      setDeleting(false)
    }
  }, [id, router])

  const formattedDate = new Date(createdAt).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div>
      <Link
        href="/social/ideas"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          fontSize: "14px",
          color: "var(--color-text-tertiary, #999)",
          textDecoration: "none",
          marginBottom: "16px",
        }}
      >
        <ArrowLeft size={16} /> 목록으로
      </Link>

      <div
        style={{
          border: "1px solid var(--color-border, #e5e7eb)",
          borderRadius: "12px",
          padding: "24px",
          backgroundColor: "var(--color-card, #ffffff)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "12px",
          }}
        >
          <span
            style={{
              backgroundColor: "var(--color-bg-secondary, #f3f4f6)",
              padding: "4px 10px",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            {ticker}
          </span>
          <span style={{ fontSize: "12px", color: "var(--color-text-tertiary, #999)" }}>
            {market}
          </span>
          <span style={{ fontSize: "13px", fontWeight: 700, color: directionColor }}>
            {direction}
          </span>
          {horizon && (
            <span
              style={{
                fontSize: "12px",
                color: "var(--color-text-secondary, #666)",
                padding: "2px 8px",
                border: "1px solid var(--color-border, #e5e7eb)",
                borderRadius: "4px",
              }}
            >
              {horizon}
            </span>
          )}
        </div>

        <h1
          style={{
            fontSize: "22px",
            fontWeight: 700,
            color: "var(--color-text-primary, #111)",
            marginBottom: "8px",
          }}
        >
          {title}
        </h1>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "20px",
            fontSize: "13px",
            color: "var(--color-text-tertiary, #999)",
          }}
        >
          <span style={{ fontWeight: 500 }}>{user.name || "익명"}</span>
          {!isOwner && (
            <FollowButton userId={user.id} initialFollowing={false} size="sm" />
          )}
          <span>{formattedDate}</span>
          <span style={{ display: "flex", alignItems: "center", gap: "2px" }}>
            <Eye size={14} /> {viewCount}
          </span>
        </div>

        {targetPrice != null && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "8px",
              backgroundColor: "var(--color-bg-secondary, #f3f4f6)",
              marginBottom: "20px",
              fontSize: "14px",
            }}
          >
            <span style={{ color: "var(--color-text-secondary, #666)" }}>
              목표가:{" "}
            </span>
            <span style={{ fontWeight: 700, color: "var(--color-text-primary, #111)" }}>
              {targetPrice.toLocaleString()}
            </span>
          </div>
        )}

        <div
          style={{
            fontSize: "15px",
            lineHeight: 1.8,
            color: "var(--color-text-primary, #111)",
            whiteSpace: "pre-wrap",
            marginBottom: "24px",
          }}
        >
          {content}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid var(--color-border, #e5e7eb)",
            paddingTop: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              onClick={handleLike}
              disabled={isLiking}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: liked
                  ? "var(--color-profit, #ef4444)"
                  : "var(--color-text-tertiary, #999)",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              <Heart size={18} fill={liked ? "currentColor" : "none"} />
              {likeCount}
            </button>
            <span
              style={{
                fontSize: "14px",
                color: "var(--color-text-tertiary, #999)",
              }}
            >
              댓글 {_count.comments}
            </span>
          </div>

          {isOwner && (
            <div style={{ display: "flex", gap: "8px" }}>
              <Link
                href={`/social/ideas/${id}?edit=1`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "1px solid var(--color-border, #e5e7eb)",
                  backgroundColor: "transparent",
                  color: "var(--color-text-secondary, #666)",
                  fontSize: "13px",
                  textDecoration: "none",
                }}
              >
                <Pencil size={14} /> 수정
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "1px solid var(--color-loss, #ef4444)",
                  backgroundColor: "transparent",
                  color: "var(--color-loss, #ef4444)",
                  fontSize: "13px",
                  cursor: deleting ? "not-allowed" : "pointer",
                }}
              >
                <Trash2 size={14} /> 삭제
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
