import { NextResponse, type NextRequest } from "next/server"
import { getNaverNews } from "@/lib/api/naver-news"
import { getGoogleNews } from "@/lib/api/google-news"
import { findStock } from "@/lib/data/stock-registry"
import type { NewsArticle } from "@/lib/api/news-types"

/** 두 제목의 유사도를 0~1로 계산 (bigram 기반 Dice coefficient) */
function similarity(a: string, b: string): number {
  const normalize = (s: string) =>
    s.replace(/[^가-힣a-zA-Z0-9]/g, "").toLowerCase()
  const na = normalize(a)
  const nb = normalize(b)
  if (na === nb) return 1

  const bigrams = (s: string): Set<string> => {
    const set = new Set<string>()
    for (let i = 0; i < s.length - 1; i++) {
      set.add(s.slice(i, i + 2))
    }
    return set
  }

  const ba = bigrams(na)
  const bb = bigrams(nb)
  if (ba.size === 0 || bb.size === 0) return 0

  let intersection = 0
  for (const b of ba) {
    if (bb.has(b)) intersection++
  }
  return (2 * intersection) / (ba.size + bb.size)
}

/** 유사/중복 뉴스를 제거하고 고유 기사만 반환 */
function deduplicateNews(articles: readonly NewsArticle[]): NewsArticle[] {
  const unique: NewsArticle[] = []

  for (const article of articles) {
    const isDuplicate = unique.some(
      (existing) => similarity(existing.title, article.title) > 0.55
    )
    if (!isDuplicate) {
      unique.push({ ...article })
    }
  }

  return unique
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await params
    const stock = findStock(ticker)
    const stockName = stock?.name ?? ticker

    const [naverNews, googleNews] = await Promise.allSettled([
      getNaverNews(stockName),
      getGoogleNews(stockName),
    ])

    const naver = naverNews.status === "fulfilled" ? naverNews.value : []
    const google = googleNews.status === "fulfilled" ? googleNews.value : []

    // 네이버 우선, 구글 보조 — 합치고 중복 제거
    const merged = [...naver, ...google]

    // 날짜순 정렬 (최신 우선)
    merged.sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )

    const deduplicated = deduplicateNews(merged)

    return NextResponse.json({
      success: true,
      data: deduplicated.slice(0, 15),
    })
  } catch (error) {
    console.error("Stock news API error:", error)
    return NextResponse.json(
      { success: false, error: "뉴스를 불러올 수 없습니다." },
      { status: 500 }
    )
  }
}
