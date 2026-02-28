import { cache, ONE_HOUR } from "@/lib/cache/memory-cache"
import * as corpCodeRegistry from "@/lib/data/corp-code-registry"
import type {
  ExecutiveStockEntry,
  MajorShareholderChange,
  InsiderActivity,
} from "./dart-insider-types"

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

function parseNumber(value: string): number {
  const cleaned = value.replace(/,/g, "").replace(/-/g, "")
  const num = Number(cleaned)
  return Number.isNaN(num) ? 0 : num
}

function parseSignedNumber(value: string): number {
  const cleaned = value.replace(/,/g, "")
  const num = Number(cleaned)
  return Number.isNaN(num) ? 0 : num
}

async function fetchExecutiveStock(
  corpCode: string
): Promise<ExecutiveStockEntry[]> {
  const cacheKey = `dart:elestock:${corpCode}`
  const cached = cache.get<ExecutiveStockEntry[]>(cacheKey)
  if (cached) return cached

  try {
    const apiKey = getDartApiKey()
    const params = new URLSearchParams({
      crtfc_key: apiKey,
      corp_code: corpCode,
    })

    const res = await fetch(
      `${DART_BASE_URL}/elestock.json?${params.toString()}`
    )
    const data = await res.json()

    if (data.status !== "000") {
      return []
    }

    const entries = (data.list ?? []) as ExecutiveStockEntry[]
    cache.set(cacheKey, entries, ONE_HOUR)
    return entries
  } catch (error) {
    console.error(`Failed to fetch executive stock for ${corpCode}:`, error)
    return []
  }
}

async function fetchMajorShareholderChanges(
  corpCode: string
): Promise<MajorShareholderChange[]> {
  const cacheKey = `dart:hyslrChg:${corpCode}`
  const cached = cache.get<MajorShareholderChange[]>(cacheKey)
  if (cached) return cached

  try {
    const apiKey = getDartApiKey()
    const params = new URLSearchParams({
      crtfc_key: apiKey,
      corp_code: corpCode,
    })

    const res = await fetch(
      `${DART_BASE_URL}/hyslrChgSttus.json?${params.toString()}`
    )
    const data = await res.json()

    if (data.status !== "000") {
      return []
    }

    const entries = (data.list ?? []) as MajorShareholderChange[]
    cache.set(cacheKey, entries, ONE_HOUR)
    return entries
  } catch (error) {
    console.error(
      `Failed to fetch major shareholder changes for ${corpCode}:`,
      error
    )
    return []
  }
}

function normalizeExecutive(entry: ExecutiveStockEntry): InsiderActivity {
  const shareChange = parseSignedNumber(entry.sp_stock_lmp_irds_cnt)
  const type: InsiderActivity["type"] =
    shareChange > 0 ? "buy" : shareChange < 0 ? "sell" : "other"

  return {
    id: entry.rcept_no,
    date: formatDate(entry.rcept_dt),
    name: entry.repror,
    position: entry.isu_exctv_ofcps || "임원",
    type,
    shares: shareChange,
    totalShares: parseNumber(entry.sp_stock_lmp_cnt),
    ratio: parseFloat(entry.sp_stock_lmp_rate) || 0,
    ratioChange: parseFloat(entry.sp_stock_lmp_irds_rate) || 0,
  }
}

function normalizeMajorShareholder(
  entry: MajorShareholderChange
): InsiderActivity {
  const shareChange = parseSignedNumber(entry.stkqy_irds)
  const type: InsiderActivity["type"] =
    shareChange > 0 ? "buy" : shareChange < 0 ? "sell" : "other"

  return {
    id: `${entry.rcept_no}-${entry.mxmm_shrholdr_nm}`,
    date: formatDate(entry.change_on || entry.rcept_dt),
    name: entry.mxmm_shrholdr_nm || entry.repror,
    position: "최대주주",
    type,
    shares: shareChange,
    totalShares: parseNumber(entry.ctr_stkqy || entry.stkqy),
    ratio: parseFloat(entry.ctr_stkrt || entry.stkrt) || 0,
    ratioChange: parseFloat(entry.stkrt_irds) || 0,
  }
}

export async function getInsiderActivities(
  stockCode: string
): Promise<InsiderActivity[]> {
  const cacheKey = `dart:insider:${stockCode}`
  const cached = cache.get<InsiderActivity[]>(cacheKey)
  if (cached) return cached

  await corpCodeRegistry.ensureLoaded()
  const corpCode = corpCodeRegistry.resolve(stockCode)
  if (!corpCode) return []

  const [executives, majorChanges] = await Promise.all([
    fetchExecutiveStock(corpCode),
    fetchMajorShareholderChanges(corpCode),
  ])

  const activities: InsiderActivity[] = [
    ...executives.map(normalizeExecutive),
    ...majorChanges.map(normalizeMajorShareholder),
  ].sort((a, b) => b.date.localeCompare(a.date))

  cache.set(cacheKey, activities, ONE_HOUR)
  return activities
}
