"use client"

import Link from "next/link"
import { ActivityFeed } from "@/components/social/ActivityFeed"

export function SocialFeedClient() {
  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "16px",
        }}
      >
        <Link
          href="/social/ideas"
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            border: "1px solid var(--color-border, #e5e7eb)",
            backgroundColor: "transparent",
            color: "var(--color-text-secondary, #666)",
            fontSize: "13px",
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          전체 탐색
        </Link>
        <Link
          href="/social/ideas/new"
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "var(--color-primary, #3b82f6)",
            color: "#ffffff",
            fontSize: "13px",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          아이디어 작성
        </Link>
        <Link
          href="/social/leaderboard"
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            border: "1px solid var(--color-border, #e5e7eb)",
            backgroundColor: "transparent",
            color: "var(--color-text-secondary, #666)",
            fontSize: "13px",
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          리더보드
        </Link>
      </div>

      <ActivityFeed
        apiUrl="/api/social/feed"
        emptyMessage="팔로우한 사용자가 없거나 아직 공유된 아이디어가 없습니다."
      />
    </div>
  )
}
