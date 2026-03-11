"use client"

import { useState, useEffect, useCallback } from "react"

interface LeaderboardEntry {
  readonly userId: string
  readonly displayName: string
  readonly returnPct: number | null
  readonly sharpe: number | null
  readonly followerCount: number
  readonly ideaCount: number
}

type SortBy = "followers" | "return" | "sharpe"

const TABS: readonly { readonly key: SortBy; readonly label: string }[] = [
  { key: "followers", label: "팔로워" },
  { key: "return", label: "수익률" },
  { key: "sharpe", label: "샤프비율" },
]

export function LeaderboardTable() {
  const [sortBy, setSortBy] = useState<SortBy>("followers")
  const [entries, setEntries] = useState<readonly LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLeaderboard = useCallback(async (by: SortBy) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/social/leaderboard?by=${by}`)
      if (res.ok) {
        const data = await res.json()
        setEntries(data)
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLeaderboard(sortBy)
  }, [fetchLeaderboard, sortBy])

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: "4px",
          marginBottom: "16px",
          padding: "4px",
          backgroundColor: "var(--color-bg-secondary, #f3f4f6)",
          borderRadius: "8px",
          width: "fit-content",
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSortBy(tab.key)}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "none",
              backgroundColor:
                sortBy === tab.key
                  ? "var(--color-card, #ffffff)"
                  : "transparent",
              color:
                sortBy === tab.key
                  ? "var(--color-text-primary, #111)"
                  : "var(--color-text-tertiary, #999)",
              fontWeight: sortBy === tab.key ? 600 : 400,
              fontSize: "13px",
              cursor: "pointer",
              boxShadow:
                sortBy === tab.key ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            color: "var(--color-text-tertiary, #999)",
          }}
        >
          불러오는 중...
        </div>
      ) : entries.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            color: "var(--color-text-tertiary, #999)",
          }}
        >
          데이터가 없습니다.
        </div>
      ) : (
        <div
          style={{
            border: "1px solid var(--color-border, #e5e7eb)",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "14px",
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: "var(--color-bg-secondary, #f9fafb)",
                }}
              >
                <th style={thStyle}>#</th>
                <th style={{ ...thStyle, textAlign: "left" }}>이름</th>
                <th style={thStyle}>아이디어</th>
                <th style={thStyle}>팔로워</th>
                <th style={thStyle}>수익률</th>
                <th style={thStyle}>샤프비율</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, idx) => (
                <tr
                  key={entry.userId}
                  style={{
                    borderTop: "1px solid var(--color-border, #e5e7eb)",
                  }}
                >
                  <td style={tdStyle}>
                    <span
                      style={{
                        fontWeight: idx < 3 ? 700 : 400,
                        color:
                          idx < 3
                            ? "var(--color-primary, #3b82f6)"
                            : "var(--color-text-tertiary, #999)",
                      }}
                    >
                      {idx + 1}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: "left", fontWeight: 500 }}>
                    {entry.displayName}
                  </td>
                  <td style={tdStyle}>{entry.ideaCount}</td>
                  <td style={tdStyle}>{entry.followerCount}</td>
                  <td style={tdStyle}>
                    {entry.returnPct != null
                      ? `${entry.returnPct.toFixed(1)}%`
                      : "\u2014"}
                  </td>
                  <td style={tdStyle}>
                    {entry.sharpe != null
                      ? entry.sharpe.toFixed(2)
                      : "\u2014"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const thStyle: React.CSSProperties = {
  padding: "12px 16px",
  fontSize: "12px",
  fontWeight: 600,
  color: "var(--color-text-tertiary, #999)",
  textAlign: "center",
  textTransform: "uppercase",
}

const tdStyle: React.CSSProperties = {
  padding: "12px 16px",
  textAlign: "center",
  color: "var(--color-text-primary, #111)",
}
