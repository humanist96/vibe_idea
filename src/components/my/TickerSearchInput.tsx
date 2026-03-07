"use client"

import { useState, useRef, useEffect } from "react"
import { Search } from "lucide-react"
import { searchStocks } from "@/lib/constants/stocks"
import { searchUSStocks } from "@/lib/data/us-stock-registry"

interface SearchResult {
  readonly ticker: string
  readonly name: string
  readonly sector: string
}

interface Props {
  readonly market: "KR" | "US"
  readonly onSelect: (result: SearchResult) => void
}

export function TickerSearchInput({ market, onSelect }: Props) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<readonly SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (query.length < 1) {
      setResults([])
      return
    }

    if (market === "KR") {
      const found = searchStocks(query).slice(0, 10)
      setResults(found.map((s) => ({ ticker: s.ticker, name: s.name, sector: s.sector })))
    } else {
      const found = searchUSStocks(query, 10)
      setResults(found.map((s) => ({ ticker: s.symbol, name: s.nameKr || s.name, sector: s.sectorKr || s.sector })))
    }
    setIsOpen(true)
  }, [query, market])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={market === "KR" ? "종목명 또는 티커 검색" : "Search symbol or name"}
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-50)] py-2.5 pl-10 pr-4 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
        />
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-card)] shadow-lg max-h-60 overflow-y-auto">
          {results.map((r) => (
            <button
              key={r.ticker}
              type="button"
              onClick={() => {
                onSelect(r)
                setQuery("")
                setIsOpen(false)
              }}
              className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-[var(--color-surface-50)] transition-colors"
            >
              <div>
                <span className="text-sm font-medium text-[var(--color-text-primary)]">
                  {r.name}
                </span>
                <span className="ml-2 text-xs text-[var(--color-text-muted)]">{r.ticker}</span>
              </div>
              <span className="text-xs text-[var(--color-text-muted)]">{r.sector}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
