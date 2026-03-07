"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils/cn"

interface SearchResult {
  readonly symbol: string
  readonly name: string
  readonly nameKr: string | null
  readonly sector: string | null
  readonly sectorKr: string | null
  readonly exchange: string | null
  readonly source: "registry" | "api"
}

export function USSearchBar() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [open, setOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const router = useRouter()
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Click outside to close
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  // Debounced search
  useEffect(() => {
    if (query.length < 1) {
      setResults([])
      setOpen(false)
      return
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/us-stocks/search?q=${encodeURIComponent(query)}`)
        const json = await res.json()
        if (json.success) {
          setResults(json.data)
          setOpen(json.data.length > 0)
        }
      } catch {
        // silently fail
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const navigate = useCallback((symbol: string) => {
    setQuery("")
    setOpen(false)
    router.push(`/us-stocks/${symbol}`)
  }, [router])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!open) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault()
      navigate(results[selectedIndex].symbol)
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }, [open, results, selectedIndex, navigate])

  return (
    <div ref={ref} className="relative">
      <div className="glass-card flex items-center gap-3 px-4 py-3">
        <Search className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setSelectedIndex(-1)
          }}
          onKeyDown={handleKeyDown}
          placeholder="미국 종목 검색 (예: Apple, AAPL, 테슬라)"
          className="flex-1 bg-transparent text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("")
              setResults([])
              setOpen(false)
              inputRef.current?.focus()
            }}
            className="rounded-md p-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute inset-x-0 top-full z-50 mt-1 overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-slate-200">
          {results.map((r, i) => (
            <button
              key={r.symbol}
              type="button"
              onClick={() => navigate(r.symbol)}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                i === selectedIndex ? "bg-amber-50" : "hover:bg-slate-50"
              )}
            >
              <span className="w-16 shrink-0 font-mono text-sm font-semibold text-[var(--color-text-primary)]">
                {r.symbol}
              </span>
              <div className="min-w-0 flex-1">
                <span className="text-sm text-[var(--color-text-primary)]">
                  {r.nameKr ?? r.name}
                </span>
                {r.nameKr && (
                  <span className="ml-1 text-[11px] text-[var(--color-text-muted)]">{r.name}</span>
                )}
              </div>
              {r.sectorKr && (
                <span className="shrink-0 text-[10px] text-[var(--color-text-muted)]">
                  {r.sectorKr}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
