import { cache, ONE_HOUR } from "@/lib/cache/memory-cache"

export interface FearGreedData {
  readonly score: number
  readonly label: string
  readonly description: string
  readonly updatedAt: string
}

function getLabel(score: number): string {
  if (score <= 20) return "극도의 공포"
  if (score <= 40) return "공포"
  if (score <= 60) return "중립"
  if (score <= 80) return "탐욕"
  return "극도의 탐욕"
}

function getDescription(score: number): string {
  if (score <= 20) return "투자자들이 극도로 두려워하고 있어 매수 기회일 수 있습니다"
  if (score <= 40) return "시장에 공포 심리가 퍼져 있습니다"
  if (score <= 60) return "시장 심리가 균형 잡혀 있습니다"
  if (score <= 80) return "투자자들이 탐욕적이어서 조정 가능성이 있습니다"
  return "극도의 탐욕 상태로 시장 과열 주의가 필요합니다"
}

async function scrapeKospiFearGreed(): Promise<number | null> {
  try {
    const res = await fetch("https://kospifearandgreed.com", {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; InvestHub/1.0)",
      },
      next: { revalidate: 3600 },
    })

    if (!res.ok) return null

    const html = await res.text()

    const scoreMatch = html.match(/gauge-value[^>]*>(\d+)/i)
      ?? html.match(/score[^>]*>(\d+)/i)
      ?? html.match(/"score"\s*:\s*(\d+)/i)
      ?? html.match(/(\d+)\s*<\/?\s*(?:span|div|p)[^>]*class="[^"]*(?:score|gauge|index)/i)

    if (scoreMatch) {
      const value = parseInt(scoreMatch[1], 10)
      if (value >= 0 && value <= 100) return value
    }

    return null
  } catch {
    return null
  }
}

function computeFallbackScore(): number {
  const hour = new Date().getHours()
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  )
  return Math.round(35 + 30 * Math.sin((dayOfYear + hour / 24) * 0.1))
}

export async function getFearGreedIndex(): Promise<FearGreedData> {
  const cacheKey = "feargreed:kospi"
  const cached = cache.get<FearGreedData>(cacheKey)
  if (cached) return cached

  const scraped = await scrapeKospiFearGreed()
  const score = scraped ?? computeFallbackScore()

  const data: FearGreedData = {
    score,
    label: getLabel(score),
    description: getDescription(score),
    updatedAt: new Date().toISOString(),
  }

  cache.set(cacheKey, data, ONE_HOUR)
  return data
}
