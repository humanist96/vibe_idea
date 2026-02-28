import { cache, ONE_HOUR } from "@/lib/cache/memory-cache"
import type { NewsArticle } from "./news-types"

export async function getGoogleNews(
  stockName: string
): Promise<readonly NewsArticle[]> {
  const cacheKey = `google:news:${stockName}`
  const cached = cache.get<readonly NewsArticle[]>(cacheKey)
  if (cached) return cached

  try {
    const query = encodeURIComponent(`${stockName} 주식`)
    const url = `https://news.google.com/rss/search?q=${query}&hl=ko&gl=KR&ceid=KR:ko`

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/rss+xml, application/xml, text/xml",
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) return []

    const xml = await res.text()
    const articles = parseRssFeed(xml)

    cache.set(cacheKey, articles, ONE_HOUR)
    return articles
  } catch (error) {
    console.error(`Failed to fetch Google News for ${stockName}:`, error)
    return []
  }
}

function parseRssFeed(xml: string): readonly NewsArticle[] {
  const articles: NewsArticle[] = []

  // Extract <item> blocks from RSS
  const itemPattern = /<item>([\s\S]*?)<\/item>/g
  let itemMatch = itemPattern.exec(xml)

  while (itemMatch && articles.length < 10) {
    const itemContent = itemMatch[1]

    const title = extractTag(itemContent, "title")
    const link = extractTag(itemContent, "link")
    const pubDate = extractTag(itemContent, "pubDate")
    const source = extractTag(itemContent, "source")

    if (title && link) {
      articles.push({
        title: decodeXmlEntities(title),
        source: source ? decodeXmlEntities(source) : "Google News",
        url: link,
        publishedAt: pubDate ?? new Date().toISOString(),
      })
    }

    itemMatch = itemPattern.exec(xml)
  }

  return articles
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function extractTag(xml: string, tag: string): string | null {
  const safeTag = escapeRegex(tag)

  // Handle CDATA sections
  const cdataPattern = new RegExp(
    `<${safeTag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${safeTag}>`
  )
  const cdataMatch = cdataPattern.exec(xml)
  if (cdataMatch) return cdataMatch[1].trim()

  // Handle regular content
  const pattern = new RegExp(`<${safeTag}[^>]*>([\\s\\S]*?)</${safeTag}>`)
  const match = pattern.exec(xml)
  return match ? match[1].trim() : null
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
}
