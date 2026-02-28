"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { Layers, ChevronRight, X, Search } from "lucide-react"

interface Theme {
  readonly no: string
  readonly name: string
  readonly stockCount: number
  readonly changePercent: number
}

interface ThemeStock {
  readonly ticker: string
  readonly name: string
  readonly price: number
  readonly change: number
  readonly changePercent: number
  readonly volume: number
}

// ── 카테고리 분류 ──────────────────────────────
interface Category {
  readonly label: string
  readonly keywords: readonly string[]
}

const CATEGORIES: readonly Category[] = [
  {
    label: "바이오/헬스케어",
    keywords: [
      "치료", "백신", "바이오", "제약", "의료", "줄기세포", "진단", "면역",
      "유전자", "mRNA", "제대혈", "임플란트", "보톡스", "탈모", "치매",
      "비만", "마이크로바이옴", "건강기능", "낙태", "피임", "코로나",
      "마스크", "방역", "폐렴", "화이자", "모더나", "출산",
    ],
  },
  {
    label: "2차전지/에너지",
    keywords: [
      "2차전지", "배터리", "에너지", "태양광", "풍력", "수소", "원자력",
      "핵융합", "ESS", "전력저장", "폐배터리", "리튬", "SOFC", "연료전지",
      "전력설비", "전선", "LNG", "LPG", "도시가스", "셰일", "페로브스카이트",
    ],
  },
  {
    label: "반도체/디스플레이",
    keywords: [
      "반도체", "HBM", "MLCC", "CXL", "뉴로모픽", "PCB", "유리 기판",
      "OLED", "LED", "마이크로 LED", "디스플레이", "플렉서블", "전자파",
      "초전도체", "그래핀", "탄소나노", "카메라모듈",
    ],
  },
  {
    label: "AI/소프트웨어",
    keywords: [
      "AI", "인공지능", "챗봇", "GPT", "로봇", "휴머노이드", "자율주행",
      "메타버스", "블록체인", "NFT", "클라우드", "SNS", "게임", "웹툰",
      "딥페이크", "음성인식", "퓨리오사", "온디바이스", "양자",
    ],
  },
  {
    label: "자동차/운송",
    keywords: [
      "자동차", "전기차", "스마트카", "타이어", "항공", "해운", "철도",
      "조선", "UAM", "드론", "자전거", "렌터카", "물류", "GTX",
    ],
  },
  {
    label: "금융/핀테크",
    keywords: [
      "은행", "증권", "보험", "핀테크", "가상화폐", "비트코인", "리츠",
      "SPAC", "STO", "스테이블코인", "창투사", "전자결제", "화폐",
      "카카오뱅크", "토스", "인터넷은행", "마이데이터", "삼성페이", "애플페이",
    ],
  },
  {
    label: "소재/산업",
    keywords: [
      "철강", "시멘트", "건설", "비철금속", "화학", "석유화학", "정유",
      "페인트", "강관", "아스콘", "골판지", "제지", "섬유", "니켈",
      "희귀금속", "희토류", "귀금속", "비료", "윤활유", "피팅", "밸브",
      "공작기계", "건설기계", "유전자원",
    ],
  },
  {
    label: "소비재/엔터",
    keywords: [
      "백화점", "편의점", "홈쇼핑", "면세점", "화장품", "패션", "의류",
      "카지노", "엔터", "영화", "영상콘텐츠", "음원", "음반", "여행",
      "호텔", "리조트", "골프", "음식료", "주류", "김밥", "수산", "육계",
      "농업", "사료", "캐릭터", "미용기기", "테마파크", "스포츠",
    ],
  },
  {
    label: "방산/항공우주",
    keywords: [
      "방위산업", "전쟁", "테러", "우주항공", "스페이스X", "누리호",
      "인공위성", "항공기부품", "우크라이나",
    ],
  },
  {
    label: "정책/이벤트",
    keywords: [
      "밸류업", "남북경협", "DMZ", "일자리", "취업", "신규상장",
      "고령화", "재건", "구제역", "불매", "수혜", "재난", "안전",
      "지진", "태풍", "장마", "겨울", "여름", "요소수", "황사", "미세먼지",
      "리모델링", "부동산", "지역화폐", "모듈러", "해저터널",
    ],
  },
  {
    label: "통신/보안",
    keywords: [
      "5G", "통신", "보안", "CCTV", "스마트홈", "스마트팩토리", "스마트그리드",
      "키오스크", "SI", "냉각", "무선충전", "스마트폰", "아이폰", "갤럭시",
      "폴더블", "3D 프린터", "모바일", "증강현실", "가상현실",
    ],
  },
]

function categorizeTheme(name: string): string {
  const lower = name.toLowerCase()
  for (const cat of CATEGORIES) {
    if (cat.keywords.some((kw) => lower.includes(kw.toLowerCase()))) {
      return cat.label
    }
  }
  return "기타"
}

const ALL_CATEGORY = "전체"

// ── 컴포넌트 ──────────────────────────────────

export default function ThemesPage() {
  const [themes, setThemes] = useState<readonly Theme[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null)
  const [themeStocks, setThemeStocks] = useState<readonly ThemeStock[]>([])
  const [stocksLoading, setStocksLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY)

  useEffect(() => {
    async function fetchThemes() {
      setLoading(true)
      try {
        const res = await fetch("/api/themes")
        const json = await res.json()
        if (json.success) {
          setThemes(json.data)
        }
      } catch {
        setThemes([])
      } finally {
        setLoading(false)
      }
    }
    fetchThemes()
  }, [])

  // 카테고리별 매핑
  const categoryMap = useMemo(() => {
    const map = new Map<string, Theme[]>()
    for (const theme of themes) {
      const cat = categorizeTheme(theme.name)
      const list = map.get(cat) ?? []
      map.set(cat, [...list, theme])
    }
    return map
  }, [themes])

  // 카테고리 목록 (테마 수 기준 정렬)
  const categoryList = useMemo(() => {
    const cats = CATEGORIES.map((c) => c.label).filter((label) => categoryMap.has(label))
    if (categoryMap.has("기타")) cats.push("기타")
    return cats
  }, [categoryMap])

  // 필터링
  const filteredThemes = useMemo(() => {
    let result = activeCategory === ALL_CATEGORY
      ? [...themes]
      : (categoryMap.get(activeCategory) ?? [])

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter((t) => t.name.toLowerCase().includes(q))
    }

    return result
  }, [themes, activeCategory, categoryMap, search])

  async function handleThemeClick(theme: Theme) {
    setSelectedTheme(theme)
    setStocksLoading(true)
    try {
      const res = await fetch(`/api/themes/${theme.no}?pageSize=20`)
      const json = await res.json()
      if (json.success) {
        setThemeStocks(json.data.stocks)
      }
    } catch {
      setThemeStocks([])
    } finally {
      setStocksLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">
          테마별 종목
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
          시장 테마별 관련 종목 현황 · {themes.length}개 테마
        </p>
      </div>

      {/* 검색 */}
      <div className="animate-fade-up stagger-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="테마 검색 (예: 반도체, 2차전지, AI...)"
            className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-50)] py-2.5 pl-10 pr-4 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent-400)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent-400)]/30 transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* 카테고리 칩 */}
      {!loading && (
        <div className="animate-fade-up stagger-2 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setActiveCategory(ALL_CATEGORY)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
              activeCategory === ALL_CATEGORY
                ? "bg-[var(--color-accent-400)] text-white shadow-sm"
                : "bg-[var(--color-surface-50)] text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-100)] hover:text-[var(--color-text-secondary)]"
            }`}
          >
            전체 ({themes.length})
          </button>
          {categoryList.map((cat) => {
            const count = categoryMap.get(cat)?.length ?? 0
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                  activeCategory === cat
                    ? "bg-[var(--color-accent-400)] text-white shadow-sm"
                    : "bg-[var(--color-surface-50)] text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-100)] hover:text-[var(--color-text-secondary)]"
                }`}
              >
                {cat} ({count})
              </button>
            )
          })}
        </div>
      )}

      {/* Selected Theme Detail */}
      {selectedTheme && (
        <Card className="animate-fade-up">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>{selectedTheme.name}</CardTitle>
              <span
                className={`text-xs font-medium ${
                  selectedTheme.changePercent >= 0
                    ? "text-[var(--color-gain)]"
                    : "text-[var(--color-loss)]"
                }`}
              >
                {selectedTheme.changePercent >= 0 ? "+" : ""}
                {selectedTheme.changePercent.toFixed(2)}%
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedTheme(null)
                setThemeStocks([])
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          {stocksLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <LoadingSkeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : themeStocks.length === 0 ? (
            <div className="py-8 text-center text-sm text-[var(--color-text-muted)]">
              종목 데이터가 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border-subtle)]">
                    <th className="py-2 text-left text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
                      종목
                    </th>
                    <th className="py-2 text-right text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
                      현재가
                    </th>
                    <th className="py-2 text-right text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
                      등락률
                    </th>
                    <th className="py-2 text-right text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-muted)] hidden sm:table-cell">
                      거래량
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {themeStocks.map((stock) => (
                    <tr
                      key={stock.ticker}
                      className="table-row-hover border-b border-[var(--color-border-subtle)]"
                    >
                      <td className="py-2.5">
                        <Link
                          href={`/stock/${stock.ticker}`}
                          className="font-medium text-[var(--color-text-primary)] hover:text-[var(--color-accent-400)] transition-colors"
                        >
                          {stock.name}
                        </Link>
                        <span className="ml-1.5 text-[10px] text-[var(--color-text-muted)]">
                          {stock.ticker}
                        </span>
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-[var(--color-text-primary)]">
                        {stock.price.toLocaleString()}
                      </td>
                      <td
                        className={`py-2.5 text-right tabular-nums font-medium ${
                          stock.changePercent > 0
                            ? "text-[var(--color-gain)]"
                            : stock.changePercent < 0
                              ? "text-[var(--color-loss)]"
                              : "text-[var(--color-text-tertiary)]"
                        }`}
                      >
                        {stock.changePercent > 0 ? "+" : ""}
                        {stock.changePercent.toFixed(2)}%
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-[var(--color-text-tertiary)] hidden sm:table-cell">
                        {stock.volume.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Theme Grid */}
      <Card className="animate-fade-up stagger-3">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-[var(--color-accent-400)]" />
            <CardTitle>
              {activeCategory === ALL_CATEGORY ? "전체 테마" : activeCategory}
            </CardTitle>
          </div>
          <span className="text-xs text-[var(--color-text-muted)]">
            {filteredThemes.length}개
          </span>
        </CardHeader>

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <LoadingSkeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : filteredThemes.length === 0 ? (
          <div className="py-12 text-center text-sm text-[var(--color-text-muted)]">
            {search ? `"${search}" 검색 결과가 없습니다.` : "테마 데이터가 없습니다."}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredThemes.map((theme) => (
              <button
                key={theme.no}
                type="button"
                onClick={() => handleThemeClick(theme)}
                className={`group flex items-center justify-between rounded-xl border p-4 text-left transition-all duration-200 ${
                  selectedTheme?.no === theme.no
                    ? "border-[var(--color-accent-400)]/40 bg-[var(--color-accent-400)]/5"
                    : "border-[var(--color-border-subtle)] hover:border-[var(--color-border-default)] hover:bg-[var(--color-glass-2)]"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-[var(--color-text-primary)] truncate">
                    {theme.name}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[10px] text-[var(--color-text-muted)]">
                      {theme.stockCount}종목
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        theme.changePercent >= 0
                          ? "text-[var(--color-gain)]"
                          : "text-[var(--color-loss)]"
                      }`}
                    >
                      {theme.changePercent >= 0 ? "+" : ""}
                      {theme.changePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)] transition-colors" />
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
