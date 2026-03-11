"use client"

import { useState, useCallback, useEffect } from "react"
import { IdeaCard } from "./IdeaCard"

interface IdeaUser {
  readonly id: string
  readonly name: string | null
  readonly image: string | null
}

interface IdeaItem {
  readonly id: string
  readonly ticker: string
  readonly market: string
  readonly direction: string
  readonly title: string
  readonly content: string
  readonly horizon: string | null
  readonly createdAt: string
  readonly viewCount: number
  readonly user: IdeaUser
  readonly _count: { readonly likes: number; readonly comments: number }
  readonly liked: boolean
}

interface ActivityFeedProps {
  readonly apiUrl: string
  readonly emptyMessage?: string
}

export function ActivityFeed({
  apiUrl,
  emptyMessage = "아이디어가 없습니다.",
}: ActivityFeedProps) {
  const [ideas, setIdeas] = useState<readonly IdeaItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const limit = 20

  const fetchIdeas = useCallback(
    async (pageNum: number) => {
      setLoading(true)
      setError("")
      try {
        const separator = apiUrl.includes("?") ? "&" : "?"
        const res = await fetch(
          `${apiUrl}${separator}page=${pageNum}&limit=${limit}`
        )
        if (!res.ok) throw new Error("불러오기 실패")
        const data = await res.json()
        setIdeas(data.ideas)
        setTotal(data.total)
      } catch {
        setError("아이디어를 불러오지 못했습니다.")
      } finally {
        setLoading(false)
      }
    },
    [apiUrl]
  )

  useEffect(() => {
    fetchIdeas(page)
  }, [fetchIdeas, page])

  const totalPages = Math.ceil(total / limit)

  if (loading) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "40px",
          color: "var(--color-text-tertiary, #999)",
        }}
      >
        불러오는 중...
      </div>
    )
  }

  if (error) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "40px",
          color: "var(--color-loss, #ef4444)",
        }}
      >
        {error}
      </div>
    )
  }

  if (ideas.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "40px",
          color: "var(--color-text-tertiary, #999)",
        }}
      >
        {emptyMessage}
      </div>
    )
  }

  return (
    <div>
      <div
        style={{ display: "flex", flexDirection: "column", gap: "12px" }}
      >
        {ideas.map((idea) => (
          <IdeaCard key={idea.id} {...idea} />
        ))}
      </div>

      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "8px",
            marginTop: "24px",
          }}
        >
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "1px solid var(--color-border, #e5e7eb)",
              backgroundColor: "transparent",
              color: "var(--color-text-secondary, #666)",
              cursor: page <= 1 ? "not-allowed" : "pointer",
              opacity: page <= 1 ? 0.5 : 1,
              fontSize: "13px",
            }}
          >
            이전
          </button>
          <span
            style={{
              fontSize: "13px",
              color: "var(--color-text-secondary, #666)",
            }}
          >
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "1px solid var(--color-border, #e5e7eb)",
              backgroundColor: "transparent",
              color: "var(--color-text-secondary, #666)",
              cursor: page >= totalPages ? "not-allowed" : "pointer",
              opacity: page >= totalPages ? 0.5 : 1,
              fontSize: "13px",
            }}
          >
            다음
          </button>
        </div>
      )}
    </div>
  )
}
