"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { ActivityFeed } from "@/components/social/ActivityFeed"

const HORIZONS = ["", "단기", "중기", "장기"] as const
const DIRECTIONS = ["", "LONG", "SHORT"] as const

export function ExploreIdeasClient() {
  const [ticker, setTicker] = useState("")
  const [horizon, setHorizon] = useState("")
  const [direction, setDirection] = useState("")

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (ticker.trim()) params.set("ticker", ticker.trim().toUpperCase())
    if (horizon) params.set("horizon", horizon)
    if (direction) params.set("direction", direction)
    const qs = params.toString()
    return `/api/social/ideas${qs ? `?${qs}` : ""}`
  }, [ticker, horizon, direction])

  const selectStyle = {
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid var(--color-border, #e5e7eb)",
    backgroundColor: "var(--color-bg-secondary, #f9fafb)",
    color: "var(--color-text-primary, #111)",
    fontSize: "13px",
    outline: "none",
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: "16px",
          alignItems: "center",
        }}
      >
        <input
          type="text"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          placeholder="종목코드 검색"
          style={{
            ...selectStyle,
            width: "140px",
          }}
        />
        <select
          value={horizon}
          onChange={(e) => setHorizon(e.target.value)}
          style={selectStyle}
        >
          <option value="">전체 기간</option>
          {HORIZONS.filter(Boolean).map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <select
          value={direction}
          onChange={(e) => setDirection(e.target.value)}
          style={selectStyle}
        >
          <option value="">전체 방향</option>
          {DIRECTIONS.filter(Boolean).map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <div style={{ marginLeft: "auto" }}>
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
            새 아이디어
          </Link>
        </div>
      </div>

      <ActivityFeed apiUrl={apiUrl} />
    </div>
  )
}
