"use client"

import { useState, useEffect, useCallback } from "react"
import { AlertRuleCard } from "./AlertRuleCard"
import { AlertRuleForm } from "./AlertRuleForm"

interface AlertRule {
  readonly id: string
  readonly ticker: string
  readonly market: string
  readonly type: string
  readonly threshold: number | null
  readonly thresholdUnit: string | null
  readonly notes: string | null
  readonly triggeredCount: number
  readonly active: boolean
  readonly createdAt: string
}

export function AlertRuleList() {
  const [rules, setRules] = useState<readonly AlertRule[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRules = useCallback(async () => {
    try {
      const res = await fetch("/api/user/alert-rules")
      if (res.ok) {
        const data = await res.json()
        setRules(data.data ?? [])
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRules()
  }, [fetchRules])

  const handleToggle = useCallback(async (id: string, active: boolean) => {
    try {
      const res = await fetch(`/api/user/alert-rules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      })

      if (res.ok) {
        setRules((prev) =>
          prev.map((r) => (r.id === id ? { ...r, active } : r))
        )
      }
    } catch {
      // Silently fail
    }
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/user/alert-rules/${id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setRules((prev) => prev.filter((r) => r.id !== id))
      }
    } catch {
      // Silently fail
    }
  }, [])

  return (
    <div className="space-y-4">
      <AlertRuleForm onCreated={fetchRules} />

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-border-default)] border-t-[var(--color-accent-500)]" />
        </div>
      ) : rules.length === 0 ? (
        <div
          className={
            "rounded-xl border border-dashed border-[var(--color-border-default)] " +
            "px-4 py-8 text-center"
          }
        >
          <p className="text-sm text-[var(--color-text-tertiary)]">
            등록된 알림 규칙이 없습니다
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            위 양식에서 알림 규칙을 추가하세요
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-medium text-[var(--color-text-secondary)]">
              {rules.length}개의 알림 규칙
            </span>
            <span className="text-xs text-[var(--color-text-tertiary)]">
              활성 {rules.filter((r) => r.active).length}개
            </span>
          </div>
          {rules.map((rule) => (
            <AlertRuleCard
              key={rule.id}
              rule={rule}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
