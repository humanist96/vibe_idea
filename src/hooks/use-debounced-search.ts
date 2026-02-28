"use client"

import { useState, useEffect, useRef, useCallback } from "react"

interface SearchResult {
  readonly ticker: string
  readonly name: string
  readonly market: "KOSPI" | "KOSDAQ"
  readonly sector: string
}

export function useDebouncedSearch(delay = 300) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (query.length < 1) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort()
      abortRef.current = new AbortController()

      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query)}`,
          { signal: abortRef.current.signal }
        )
        const json = await res.json()
        if (json.success) {
          setResults(json.data)
        }
      } catch {
        // Aborted or network error - ignore
      } finally {
        setLoading(false)
      }
    }, delay)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query, delay])

  const clear = useCallback(() => {
    setQuery("")
    setResults([])
  }, [])

  return { query, setQuery, results, loading, clear }
}
