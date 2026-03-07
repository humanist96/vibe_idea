"use client"

import { useState, useCallback } from "react"
import { Sparkles, Search, X, Loader2 } from "lucide-react"
import type { Filters } from "./FilterPanel"

interface NlSearchBarProps {
  readonly onFiltersApplied: (filters: Filters, sort?: string, order?: "asc" | "desc") => void
}

const EXAMPLE_QUERIES = [
  "PER 10 이하 고배당 대형주",
  "코스닥 소형주 급등",
  "외국인 보유 비율 높은 저PBR 종목",
  "배당률 4% 이상 전기전자 섹터",
]

export function NlSearchBar({ onFiltersApplied }: NlSearchBarProps) {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [description, setDescription] = useState("")
  const [error, setError] = useState("")

  const handleSearch = useCallback(async (searchQuery: string) => {
    const trimmed = searchQuery.trim()
    if (!trimmed || trimmed.length < 2) return

    setLoading(true)
    setError("")
    setDescription("")

    try {
      const res = await fetch("/api/screener/nl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
      })
      const json = await res.json()

      if (!json.success) {
        setError(json.error ?? "변환에 실패했습니다.")
        return
      }

      const { filters, sort, order, description: desc } = json.data
      setDescription(desc)
      onFiltersApplied(filters, sort, order)
    } catch {
      setError("요청 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }, [onFiltersApplied])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch(query)
  }

  const handleExampleClick = (example: string) => {
    setQuery(example)
    handleSearch(example)
  }

  const handleClear = () => {
    setQuery("")
    setDescription("")
    setError("")
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <Sparkles className="absolute left-3.5 h-4 w-4 text-amber-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="AI 검색: &quot;PER 10 이하 고배당 대형주&quot;, &quot;코스닥 급등 소형주&quot; ..."
            disabled={loading}
            className={
              "w-full rounded-xl py-2.5 pl-10 pr-20 text-sm outline-none transition-all duration-200 " +
              "bg-gradient-to-r from-amber-50/50 to-orange-50/50 " +
              "text-[var(--color-text-primary)] " +
              "ring-1 ring-amber-200/60 " +
              "placeholder:text-[var(--color-text-muted)] " +
              "focus:ring-2 focus:ring-amber-400/50 focus:shadow-lg focus:shadow-amber-500/5 " +
              "disabled:opacity-60"
            }
          />
          <div className="absolute right-2 flex items-center gap-1">
            {query && !loading && (
              <button
                type="button"
                onClick={handleClear}
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className={
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 " +
                "bg-amber-500 text-white shadow-sm " +
                "hover:bg-amber-600 " +
                "disabled:opacity-40 disabled:cursor-not-allowed"
              }
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Search className="h-3.5 w-3.5" />
              )}
              AI 검색
            </button>
          </div>
        </div>
      </form>

      {/* Example queries */}
      {!description && !error && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-medium text-[var(--color-text-muted)]">예시:</span>
          {EXAMPLE_QUERIES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => handleExampleClick(example)}
              disabled={loading}
              className={
                "rounded-full px-2.5 py-1 text-[11px] font-medium transition-all duration-200 " +
                "bg-[var(--color-glass-2)] text-[var(--color-text-tertiary)] " +
                "ring-1 ring-[var(--color-border-subtle)] " +
                "hover:bg-amber-50 hover:text-amber-700 hover:ring-amber-200 " +
                "disabled:opacity-40"
              }
            >
              {example}
            </button>
          ))}
        </div>
      )}

      {/* AI result description */}
      {description && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-50/80 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200/60">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
          <span>
            <strong>AI 필터 적용:</strong> {description}
          </span>
          <button
            type="button"
            onClick={handleClear}
            className="ml-auto shrink-0 rounded p-0.5 text-amber-400 hover:text-amber-600 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 ring-1 ring-red-200/60">
          {error}
        </div>
      )}
    </div>
  )
}
