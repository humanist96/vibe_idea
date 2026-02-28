"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { useDebouncedSearch } from "@/hooks/use-debounced-search"
import { MobileNav } from "./MobileNav"

export function Header() {
  const router = useRouter()
  const { query, setQuery, results, clear } = useDebouncedSearch(300)
  const [showResults, setShowResults] = useState(false)

  const handleChange = useCallback(
    (value: string) => {
      setQuery(value)
      if (value.length >= 1) {
        setShowResults(true)
      } else {
        setShowResults(false)
      }
    },
    [setQuery]
  )

  const handleSelect = useCallback(
    (ticker: string) => {
      clear()
      setShowResults(false)
      router.push(`/stock/${ticker}`)
    },
    [router, clear]
  )

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-gray-200 bg-white/80 px-4 backdrop-blur-sm lg:px-6">
      <MobileNav />

      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => query.length >= 1 && setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          placeholder="종목명 또는 코드 검색..."
          className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-10 pr-4 text-sm outline-none transition-colors focus:border-blue-500 focus:bg-white"
        />

        {showResults && results.length > 0 && (
          <div className="absolute left-0 top-full mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
            {results.map((stock) => (
              <button
                key={stock.ticker}
                type="button"
                onMouseDown={() => handleSelect(stock.ticker)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-gray-50"
              >
                <span className="font-mono text-xs text-gray-400">
                  {stock.ticker}
                </span>
                <span className="font-medium text-gray-900">{stock.name}</span>
                <span className="ml-auto text-xs text-gray-400">
                  {stock.market}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  )
}
