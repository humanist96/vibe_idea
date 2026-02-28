import { cache, ONE_DAY } from "@/lib/cache/memory-cache"
import * as corpCodeRegistry from "@/lib/data/corp-code-registry"
import type { DartDividendEntry, DividendInfo } from "./dart-dividend-types"

const DART_BASE_URL = "https://opendart.fss.or.kr/api"

function getDartApiKey(): string {
  const key = process.env.DART_API_KEY
  if (!key) {
    throw new Error("DART_API_KEY is not configured")
  }
  return key
}

function parseAmount(str: string): number {
  if (!str || str === "-") return 0
  return Number(str.replace(/,/g, "")) || 0
}

export async function getDividendInfo(
  stockCode: string,
  year?: number
): Promise<DividendInfo | null> {
  const bsnsYear = year ?? new Date().getFullYear() - 1
  const cacheKey = `dart:dividend:${stockCode}:${bsnsYear}`
  const cached = cache.get<DividendInfo>(cacheKey)
  if (cached) return cached

  await corpCodeRegistry.ensureLoaded()
  const corpCode = corpCodeRegistry.resolve(stockCode)
  if (!corpCode) return null

  try {
    const apiKey = getDartApiKey()
    const params = new URLSearchParams({
      crtfc_key: apiKey,
      corp_code: corpCode,
      bsns_year: String(bsnsYear),
      reprt_code: "11011",
    })

    const res = await fetch(
      `${DART_BASE_URL}/alotMatter.json?${params.toString()}`
    )
    const data = await res.json()

    if (data.status !== "000" || !data.list) return null

    const entries = data.list as DartDividendEntry[]

    // Find cash dividend per share row
    const cashDivRow = entries.find(
      (e) =>
        e.se.includes("주당 현금배당금") ||
        e.se.includes("1주당 현금배당금")
    )

    if (!cashDivRow) return null

    const currentDiv = parseAmount(cashDivRow.thstrm)
    const prevDiv = parseAmount(cashDivRow.frmtrm)

    // Find dividend yield row
    const yieldRow = entries.find(
      (e) =>
        e.se.includes("현금배당수익률") ||
        e.se.includes("현금배당 수익률")
    )
    const dividendYield = yieldRow ? parseAmount(yieldRow.thstrm) : 0

    // Find payout ratio row
    const payoutRow = entries.find(
      (e) =>
        e.se.includes("현금배당성향") ||
        e.se.includes("배당성향")
    )
    const payoutRatio = payoutRow ? parseAmount(payoutRow.thstrm) : 0

    const result: DividendInfo = {
      ticker: stockCode,
      corpName: cashDivRow.corp_name,
      year: bsnsYear,
      dividendPerShare: currentDiv,
      prevDividendPerShare: prevDiv,
      dividendYield,
      payoutRatio,
      dividendType: cashDivRow.stock_knd || "보통주",
    }

    cache.set(cacheKey, result, ONE_DAY)
    return result
  } catch {
    return null
  }
}

export async function getBatchDividendInfo(
  stockCodes: readonly string[],
  year?: number
): Promise<DividendInfo[]> {
  const results = await Promise.all(
    stockCodes.map((code) => getDividendInfo(code, year))
  )
  return results.filter((r): r is DividendInfo => r !== null)
}
