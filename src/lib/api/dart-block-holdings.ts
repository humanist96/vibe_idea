import { cache, ONE_HOUR } from "@/lib/cache/memory-cache"
import * as corpCodeRegistry from "@/lib/data/corp-code-registry"
import type { DartMajorStockEntry, BlockHolding } from "./dart-block-holdings-types"

const DART_BASE_URL = "https://opendart.fss.or.kr/api"

function getDartApiKey(): string {
  const key = process.env.DART_API_KEY
  if (!key) {
    throw new Error("DART_API_KEY is not configured")
  }
  return key
}

function formatDate(raw: string): string {
  if (raw.length === 8) {
    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
  }
  return raw
}

function parseNum(str: string): number {
  if (!str || str === "-") return 0
  return Number(str.replace(/,/g, "")) || 0
}

function parseSignedNum(str: string): number {
  if (!str || str === "-") return 0
  return Number(str.replace(/,/g, "")) || 0
}

export async function getBlockHoldings(
  stockCode: string
): Promise<BlockHolding[]> {
  const cacheKey = `dart:majorstock:${stockCode}`
  const cached = cache.get<BlockHolding[]>(cacheKey)
  if (cached) return cached

  await corpCodeRegistry.ensureLoaded()
  const corpCode = corpCodeRegistry.resolve(stockCode)
  if (!corpCode) return []

  try {
    const apiKey = getDartApiKey()
    const params = new URLSearchParams({
      crtfc_key: apiKey,
      corp_code: corpCode,
    })

    const res = await fetch(
      `${DART_BASE_URL}/majorstock.json?${params.toString()}`
    )
    const data = await res.json()

    if (data.status !== "000" || !data.list) return []

    const entries = data.list as DartMajorStockEntry[]
    const holdings: BlockHolding[] = entries.map((e) => ({
      ticker: stockCode,
      corpName: e.corp_name,
      reportDate: formatDate(e.rcept_dt),
      reportType: e.report_tp || "대량보유",
      reporter: e.repror,
      shares: parseNum(e.stkqy),
      sharesChange: parseSignedNum(e.stkqy_irds),
      ratio: parseFloat(e.stkrt) || 0,
      ratioChange: parseFloat(e.stkrt_irds) || 0,
      totalShares: parseNum(e.ctr_stkqy),
      totalRatio: parseFloat(e.ctr_stkrt) || 0,
    }))

    const sorted = holdings.sort((a, b) => b.reportDate.localeCompare(a.reportDate))
    cache.set(cacheKey, sorted, ONE_HOUR)
    return sorted
  } catch {
    return []
  }
}

export async function getBatchBlockHoldings(
  stockCodes: readonly string[]
): Promise<BlockHolding[]> {
  const results = await Promise.all(
    stockCodes.map((code) => getBlockHoldings(code))
  )
  return results
    .flat()
    .sort((a, b) => b.reportDate.localeCompare(a.reportDate))
}
