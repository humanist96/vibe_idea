"use client"

import Link from "next/link"
import { Heart } from "lucide-react"
import { useState, useCallback } from "react"

interface IdeaCardUser {
  readonly id: string
  readonly name: string | null
  readonly image: string | null
}

interface IdeaCardProps {
  readonly id: string
  readonly ticker: string
  readonly market: string
  readonly direction: string
  readonly title: string
  readonly content: string
  readonly horizon: string | null
  readonly createdAt: string
  readonly viewCount: number
  readonly user: IdeaCardUser
  readonly _count: { readonly likes: number; readonly comments: number }
  readonly liked: boolean
  readonly onLikeToggle?: (id: string) => void
}

export function IdeaCard({
  id,
  ticker,
  market,
  direction,
  title,
  content,
  horizon,
  createdAt,
  viewCount,
  user,
  _count,
  liked: initialLiked,
  onLikeToggle,
}: IdeaCardProps) {
  const [liked, setLiked] = useState(initialLiked)
  const [likeCount, setLikeCount] = useState(_count.likes)
  const [isLiking, setIsLiking] = useState(false)

  const handleLike = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
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
        } else {
          onLikeToggle?.(id)
        }
      } catch {
        setLiked((prev) => !prev)
        setLikeCount((prev) => (liked ? prev + 1 : prev - 1))
      } finally {
        setIsLiking(false)
      }
    },
    [id, liked, isLiking, onLikeToggle]
  )

  const directionColor =
    direction === "LONG"
      ? "var(--color-profit, #ef4444)"
      : "var(--color-loss, #3b82f6)"

  const formattedDate = new Date(createdAt).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  })

  return (
    <Link href={`/social/ideas/${id}`} style={{ textDecoration: "none" }}>
      <div
        style={{
          border: "1px solid var(--color-border, #e5e7eb)",
          borderRadius: "12px",
          padding: "16px",
          backgroundColor: "var(--color-card, #ffffff)",
          transition: "box-shadow 0.2s",
          cursor: "pointer",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.boxShadow =
            "0 4px 12px rgba(0,0,0,0.08)"
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.boxShadow = "none"
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "8px",
          }}
        >
          <span
            style={{
              backgroundColor: "var(--color-bg-secondary, #f3f4f6)",
              padding: "2px 8px",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--color-text-primary, #111)",
            }}
          >
            {ticker}
          </span>
          <span
            style={{
              fontSize: "11px",
              color: "var(--color-text-tertiary, #999)",
            }}
          >
            {market}
          </span>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: directionColor,
            }}
          >
            {direction}
          </span>
          {horizon && (
            <span
              style={{
                fontSize: "11px",
                color: "var(--color-text-secondary, #666)",
                marginLeft: "auto",
              }}
            >
              {horizon}
            </span>
          )}
        </div>

        <h3
          style={{
            fontSize: "15px",
            fontWeight: 600,
            color: "var(--color-text-primary, #111)",
            marginBottom: "6px",
            lineHeight: 1.3,
          }}
        >
          {title}
        </h3>

        <p
          style={{
            fontSize: "13px",
            color: "var(--color-text-secondary, #666)",
            lineHeight: 1.5,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            marginBottom: "12px",
          }}
        >
          {content}
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "12px",
            color: "var(--color-text-tertiary, #999)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span>{user.name || "익명"}</span>
            <span>{formattedDate}</span>
            <span>조회 {viewCount}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={handleLike}
              disabled={isLiking}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: liked
                  ? "var(--color-profit, #ef4444)"
                  : "var(--color-text-tertiary, #999)",
                padding: "2px 4px",
                fontSize: "12px",
              }}
            >
              <Heart size={14} fill={liked ? "currentColor" : "none"} />
              {likeCount}
            </button>
            <span>댓글 {_count.comments}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
