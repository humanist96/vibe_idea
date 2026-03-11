"use client"

import { useState, useCallback } from "react"
import { UserPlus, UserCheck } from "lucide-react"

interface FollowButtonProps {
  readonly userId: string
  readonly initialFollowing: boolean
  readonly size?: "sm" | "md"
}

export function FollowButton({
  userId,
  initialFollowing,
  size = "md",
}: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing)
  const [loading, setLoading] = useState(false)

  const handleToggle = useCallback(async () => {
    if (loading) return
    setLoading(true)
    setFollowing((prev) => !prev)

    try {
      const res = await fetch(`/api/social/follow/${userId}`, {
        method: "POST",
      })
      if (!res.ok) {
        setFollowing((prev) => !prev)
      } else {
        const data = await res.json()
        setFollowing(data.following)
      }
    } catch {
      setFollowing((prev) => !prev)
    } finally {
      setLoading(false)
    }
  }, [userId, loading])

  const isSm = size === "sm"
  const iconSize = isSm ? 14 : 16
  const Icon = following ? UserCheck : UserPlus

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: isSm ? "4px" : "6px",
        padding: isSm ? "4px 10px" : "6px 14px",
        borderRadius: "6px",
        border: following
          ? "1px solid var(--color-primary, #3b82f6)"
          : "1px solid var(--color-border, #e5e7eb)",
        backgroundColor: following
          ? "var(--color-primary, #3b82f6)"
          : "transparent",
        color: following
          ? "#ffffff"
          : "var(--color-text-secondary, #666)",
        fontSize: isSm ? "12px" : "13px",
        fontWeight: 500,
        cursor: loading ? "not-allowed" : "pointer",
        transition: "all 0.2s",
      }}
    >
      <Icon size={iconSize} />
      {following ? "팔로잉" : "팔로우"}
    </button>
  )
}
