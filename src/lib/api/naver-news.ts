import { cache, ONE_HOUR } from "@/lib/cache/memory-cache"
import type { NewsArticle } from "./news-types"

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml",
  "Accept-Language": "ko-KR,ko;q=0.9",
}

export async function getNaverNews(
  stockName: string
): Promise<readonly NewsArticle[]> {
  const cacheKey = `naver:news:${stockName}`
  const cached = cache.get<readonly NewsArticle[]>(cacheKey)
  if (cached) return cached

  try {
    const query = encodeURIComponent(`${stockName} 주가`)
    const url = `https://m.search.naver.com/search.naver?where=news&query=${query}&sm=tab_opt&sort=1`

    const res = await fetch(url, {
      headers: HEADERS,
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) return []

    const html = await res.text()
    const articles = parseNaverNewsHtml(html)

    cache.set(cacheKey, articles, ONE_HOUR)
    return articles
  } catch (error) {
    console.error(`Failed to fetch Naver news for ${stockName}:`, error)
    return []
  }
}

function parseNaverNewsHtml(html: string): readonly NewsArticle[] {
  const articles: NewsArticle[] = []

  // Match news titles and links from Naver mobile news search results
  // Pattern targets <a class="news_tit" href="..." title="...">
  const titlePattern =
    /class="news_tit"[^>]*href="([^"]*)"[^>]*title="([^"]*)"/g
  let match = titlePattern.exec(html)

  while (match && articles.length < 10) {
    const [, url, title] = match
    if (url && title) {
      articles.push({
        title: decodeHtmlEntities(title),
        source: "네이버뉴스",
        url,
        publishedAt: new Date().toISOString(),
      })
    }
    match = titlePattern.exec(html)
  }

  // Fallback: try alternative pattern for news items
  if (articles.length === 0) {
    const altPattern =
      /<a[^>]*class="[^"]*news[^"]*tit[^"]*"[^>]*href="([^"]*)"[^>]*>([^<]+)</g
    let altMatch = altPattern.exec(html)

    while (altMatch && articles.length < 10) {
      const [, url, title] = altMatch
      if (url && title) {
        articles.push({
          title: decodeHtmlEntities(title.trim()),
          source: "네이버뉴스",
          url,
          publishedAt: new Date().toISOString(),
        })
      }
      altMatch = altPattern.exec(html)
    }
  }

  // Extract source and date info where available
  const infoPattern = new RegExp(
    'class="[^"]*info_group[^"]*"[^>]*>[\\s\\S]*?class="[^"]*press[^"]*"[^>]*>([^<]*)<[\\s\\S]*?<span[^>]*>([^<]*)<',
    "g"
  )
  let infoMatch = infoPattern.exec(html)
  let idx = 0

  while (infoMatch && idx < articles.length) {
    const [, source, dateStr] = infoMatch
    if (source) {
      articles[idx] = {
        ...articles[idx],
        source: decodeHtmlEntities(source.trim()),
      }
    }
    if (dateStr) {
      articles[idx] = {
        ...articles[idx],
        publishedAt: dateStr.trim(),
      }
    }
    idx++
    infoMatch = infoPattern.exec(html)
  }

  return articles
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
}
