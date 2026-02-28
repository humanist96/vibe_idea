import { cache, ONE_HOUR } from "@/lib/cache/memory-cache"
import type {
  DartDisclosureEntry,
  CorporateEvent,
  EventCategory,
} from "./dart-events-types"

const DART_BASE_URL = "https://opendart.fss.or.kr/api"

function getDartApiKey(): string {
  const key = process.env.DART_API_KEY
  if (!key) {
    throw new Error("DART_API_KEY is not configured")
  }
  return key
}

function formatDateCompact(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}${m}${day}`
}

function formatDate(raw: string): string {
  if (raw.length === 8) {
    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
  }
  return raw
}

function classifyEvent(reportName: string): EventCategory {
  if (reportName.includes("유상증자")) return "유상증자"
  if (reportName.includes("무상증자")) return "무상증자"
  if (reportName.includes("자기주식") || reportName.includes("자사주")) return "자사주"
  if (reportName.includes("사채") || reportName.includes("전환사채") || reportName.includes("신주인수권")) return "사채"
  if (reportName.includes("합병") || reportName.includes("분할")) return "합병분할"
  return "기타"
}

export async function getCorporateEvents(
  days = 30,
  category?: EventCategory
): Promise<CorporateEvent[]> {
  const cacheKey = `dart:events:${days}:${category ?? "all"}`
  const cached = cache.get<CorporateEvent[]>(cacheKey)
  if (cached) return cached

  try {
    const apiKey = getDartApiKey()
    const end = new Date()
    const start = new Date(end)
    start.setDate(start.getDate() - days)

    const params = new URLSearchParams({
      crtfc_key: apiKey,
      bgn_de: formatDateCompact(start),
      end_de: formatDateCompact(end),
      pblntf_ty: "B",
      page_count: "100",
    })

    const res = await fetch(
      `${DART_BASE_URL}/list.json?${params.toString()}`
    )
    const data = await res.json()

    if (data.status !== "000" || !data.list) return []

    const entries = data.list as DartDisclosureEntry[]
    let events: CorporateEvent[] = entries
      .filter((e) => e.stock_code && e.stock_code.trim() !== "")
      .map((e) => ({
        id: e.rcept_no,
        date: formatDate(e.rcept_dt),
        corpName: e.corp_name,
        stockCode: e.stock_code,
        reportName: e.report_nm,
        category: classifyEvent(e.report_nm),
        filer: e.flr_nm,
        rceptNo: e.rcept_no,
      }))

    if (category) {
      events = events.filter((e) => e.category === category)
    }

    events.sort((a, b) => b.date.localeCompare(a.date))

    cache.set(cacheKey, events, ONE_HOUR)
    return events
  } catch {
    return []
  }
}
