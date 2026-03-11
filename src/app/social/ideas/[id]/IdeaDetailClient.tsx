"use client"

import { useState, useEffect, useCallback } from "react"
import { IdeaDetail } from "@/components/social/IdeaDetail"
import { CommentList } from "@/components/social/CommentList"
import { CommentForm } from "@/components/social/CommentForm"
import { useSession } from "next-auth/react"

interface IdeaUser {
  readonly id: string
  readonly name: string | null
  readonly image: string | null
}

interface Comment {
  readonly id: string
  readonly content: string
  readonly createdAt: string
  readonly user: IdeaUser
}

interface IdeaData {
  readonly id: string
  readonly ticker: string
  readonly market: string
  readonly direction: string
  readonly title: string
  readonly content: string
  readonly targetPrice: number | null
  readonly horizon: string | null
  readonly isPublic: boolean
  readonly viewCount: number
  readonly createdAt: string
  readonly updatedAt: string
  readonly user: IdeaUser
  readonly _count: { readonly likes: number; readonly comments: number }
  readonly liked: boolean
}

interface IdeaDetailClientProps {
  readonly ideaId: string
}

export function IdeaDetailClient({ ideaId }: IdeaDetailClientProps) {
  const { data: session } = useSession()
  const [idea, setIdea] = useState<IdeaData | null>(null)
  const [comments, setComments] = useState<readonly Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [ideaRes, commentsRes] = await Promise.all([
        fetch(`/api/social/ideas/${ideaId}`),
        fetch(`/api/social/ideas/${ideaId}/comments`),
      ])

      if (!ideaRes.ok) {
        const data = await ideaRes.json()
        throw new Error(data.error || "아이디어를 불러오지 못했습니다.")
      }

      const ideaData = await ideaRes.json()
      setIdea(ideaData)

      if (commentsRes.ok) {
        const commentsData = await commentsRes.json()
        setComments(commentsData)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }, [ideaId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCommentAdded = useCallback(
    (comment: Comment) => {
      setComments((prev) => [...prev, comment])
    },
    []
  )

  const handleCommentDeleted = useCallback(
    (commentId: string) => {
      setComments((prev) => prev.filter((c) => c.id !== commentId))
    },
    []
  )

  if (loading) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "60px",
          color: "var(--color-text-tertiary, #999)",
        }}
      >
        불러오는 중...
      </div>
    )
  }

  if (error || !idea) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "60px",
          color: "var(--color-loss, #ef4444)",
        }}
      >
        {error || "아이디어를 찾을 수 없습니다."}
      </div>
    )
  }

  const currentUserId = session?.user?.id
  const isOwner = currentUserId === idea.user.id

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <IdeaDetail {...idea} isOwner={isOwner} />

      <div
        style={{
          border: "1px solid var(--color-border, #e5e7eb)",
          borderRadius: "12px",
          padding: "20px",
          backgroundColor: "var(--color-card, #ffffff)",
        }}
      >
        <h2
          style={{
            fontSize: "16px",
            fontWeight: 600,
            color: "var(--color-text-primary, #111)",
            marginBottom: "16px",
          }}
        >
          댓글 ({comments.length})
        </h2>

        <CommentList
          comments={comments}
          currentUserId={currentUserId}
          onDeleted={handleCommentDeleted}
        />

        {currentUserId && (
          <div style={{ marginTop: "16px" }}>
            <CommentForm
              ideaId={ideaId}
              onCommentAdded={handleCommentAdded}
            />
          </div>
        )}
      </div>
    </div>
  )
}
