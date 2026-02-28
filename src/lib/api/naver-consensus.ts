import { cache, FIVE_MINUTES } from "@/lib/cache/memory-cache"

const NAVER_STOCK_API = "https://m.stock.naver.com/api"
const HEADERS = { "User-Agent": "Mozilla/5.0" }

export interface ConsensusInfo {
  readonly targetPrice: number | null
  readonly investmentOpinion: string | null
  readonly analystCount: number
}

export interface ResearchReport {
  readonly title: string
  readonly provider: string
  readonly date: string
  readonly targetPrice: number | null
}

export interface ConsensusData {
  readonly consensus: ConsensusInfo
  readonly reports: readonly ResearchReport[]
}

// recommMean: 투자의견 평균 (5=적극매수, 4=매수, 3=중립, 2=매도, 1=적극매도)
function mapRecommMean(value: string | null | undefined): string | null {
  if (!value) return null
  const num = parseFloat(value)
  if (isNaN(num)) return null
  if (num >= 4.5) return "적극 매수"
  if (num >= 3.5) return "매수"
  if (num >= 2.5) return "중립"
  if (num >= 1.5) return "매도"
  return "적극 매도"
}

function formatReportDate(wdt: string): string {
  if (!wdt || wdt.length !== 8) return wdt ?? ""
  return `${wdt.slice(0, 4)}.${wdt.slice(4, 6)}.${wdt.slice(6, 8)}`
}

export async function getConsensus(ticker: string): Promise<ConsensusData | null> {
  const cacheKey = `naver:consensus:${ticker}`
  const cached = cache.get<ConsensusData>(cacheKey)
  if (cached) return cached

  try {
    const res = await fetch(`${NAVER_STOCK_API}/stock/${ticker}/integration`, {
      headers: HEADERS,
    })

    if (!res.ok) return null

    const data = await res.json()
    const ci = data?.consensusInfo
    const researches: unknown[] = data?.researches ?? []

    if (!ci && researches.length === 0) return null

    // consensusInfo: {priceTargetMean:"229,800", recommMean:"4.00", ...}
    const consensus: ConsensusInfo = {
      targetPrice: parseNumber(ci?.priceTargetMean),
      investmentOpinion: mapRecommMean(ci?.recommMean),
      analystCount: researches.length,
    }

    // researches: [{tit, bnm, wdt, rcnt, ...}, ...]
    // rcnt = target price (리포트 목표가)
    const reports: ResearchReport[] = researches
      .slice(0, 10)
      .map((item) => {
        const r = item as Record<string, unknown>
        return {
          title: String(r.tit ?? r.title ?? ""),
          provider: String(r.bnm ?? r.stockResearchProvider ?? ""),
          date: formatReportDate(String(r.wdt ?? r.writeDate ?? "")),
          targetPrice: parseNumber(r.rcnt ?? r.targetPrice),
        }
      })

    const result: ConsensusData = { consensus, reports }
    cache.set(cacheKey, result, FIVE_MINUTES)
    return result
  } catch (error) {
    console.error(`Failed to fetch consensus for ${ticker}:`, error)
    return null
  }
}

function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null
  const num = Number(String(value).replace(/,/g, ""))
  return isNaN(num) ? null : num
}
