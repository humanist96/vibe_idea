import { cache, ONE_HOUR } from "@/lib/cache/memory-cache"
import type { NewsArticle } from "./news-types"

const NAVER_SEARCH_API = "https://openapi.naver.com/v1/search/news.json"

function getNaverCredentials(): { clientId: string; clientSecret: string } | null {
  const clientId = process.env.NAVER_CLIENT_ID
  const clientSecret = process.env.NAVER_CLIENT_SECRET
  if (!clientId || !clientSecret) return null
  return { clientId, clientSecret }
}

interface NaverNewsItem {
  readonly title: string
  readonly originallink: string
  readonly link: string
  readonly description: string
  readonly pubDate: string
}

interface NaverSearchResponse {
  readonly items: readonly NaverNewsItem[]
  readonly total: number
  readonly display: number
}

export async function getNaverNews(
  stockName: string
): Promise<readonly NewsArticle[]> {
  const cacheKey = `naver:news:${stockName}`
  const cached = cache.get<readonly NewsArticle[]>(cacheKey)
  if (cached) return cached

  const credentials = getNaverCredentials()
  if (!credentials) return []

  try {
    const query = encodeURIComponent(`${stockName} 주가`)
    const url = `${NAVER_SEARCH_API}?query=${query}&display=10&sort=date`

    const res = await fetch(url, {
      headers: {
        "X-Naver-Client-Id": credentials.clientId,
        "X-Naver-Client-Secret": credentials.clientSecret,
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) return []

    const data = (await res.json()) as NaverSearchResponse

    const articles: NewsArticle[] = data.items.map((item) => ({
      title: stripHtmlTags(item.title),
      source: "네이버뉴스",
      url: item.originallink || item.link,
      publishedAt: item.pubDate,
      snippet: stripHtmlTags(item.description),
    }))

    cache.set(cacheKey, articles, ONE_HOUR)
    return articles
  } catch (error) {
    console.error(`Failed to fetch Naver news for ${stockName}:`, error)
    return []
  }
}

function stripHtmlTags(text: string): string {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
}
