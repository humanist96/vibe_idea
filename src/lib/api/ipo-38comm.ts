import { cache, FIVE_MINUTES } from "@/lib/cache/memory-cache"

const HEADERS = { "User-Agent": "Mozilla/5.0" }

export interface IpoItem {
  readonly company: string
  readonly sector: string
  readonly leadUnderwriter: string
  readonly offeringPriceRange: string
  readonly offeringPrice: string
  readonly demandForecastDate: string
  readonly subscriptionDate: string
  readonly listingDate: string
  readonly competitionRate: string
  readonly status: "upcoming" | "active" | "listed"
  readonly dDay: number | null
}

function parseDate(dateStr: string): Date | null {
  const cleaned = dateStr.replace(/\s/g, "").trim()
  // "2026.03.10" or "2026.03.10~03.12" — 첫 번째 날짜를 파싱
  const match = cleaned.match(/(\d{4})\.(\d{2})\.(\d{2})/)
  if (!match) return null
  return new Date(
    parseInt(match[1]),
    parseInt(match[2]) - 1,
    parseInt(match[3])
  )
}

function parseEndDate(dateStr: string): Date | null {
  const cleaned = dateStr.replace(/\s/g, "").trim()
  // "2026.03.10~03.12" → 끝 날짜 파싱
  const match = cleaned.match(/(\d{4})\.(\d{2})\.(\d{2})~(\d{2})\.(\d{2})/)
  if (!match) return parseDate(dateStr)
  return new Date(
    parseInt(match[1]),
    parseInt(match[4]) - 1,
    parseInt(match[5])
  )
}

function getDDay(dateStr: string): number | null {
  const date = parseDate(dateStr)
  if (!date) return null
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

function getStatus(subscriptionDate: string): "upcoming" | "active" | "listed" {
  const startDate = parseDate(subscriptionDate)
  const endDate = parseEndDate(subscriptionDate)
  if (!startDate) return "upcoming"

  const now = new Date()
  now.setHours(0, 0, 0, 0)

  // 청약 종료일이 지났으면 "listed" (청약 완료)
  if (endDate && endDate.getTime() < now.getTime()) return "listed"
  // 청약 시작일이 지났으면 "active" (청약 중)
  if (startDate.getTime() <= now.getTime()) return "active"
  return "upcoming"
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").trim()
}

function parseIpoTable(html: string): IpoItem[] {
  const items: IpoItem[] = []

  // 38.co.kr 테이블은 summary="공모주 청약일정" 속성을 가짐
  const tableMatch = html.match(
    /<table[^>]*summary="공모주 청약일정"[^>]*>([\s\S]*?)<\/table>/
  )
  if (!tableMatch) return items

  const tableHtml = tableMatch[1]

  // bgcolor='#FFFFFF' 또는 bgcolor='#F8F8F8' 패턴의 행만 파싱
  const trRegex = /<tr\s+bgcolor='#(?:FFFFFF|F8F8F8)'[^>]*>([\s\S]*?)<\/tr>/g
  let trMatch: RegExpExecArray | null

  while ((trMatch = trRegex.exec(tableHtml)) !== null) {
    const rowHtml = trMatch[1]

    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/g
    const cells: string[] = []
    let tdMatch: RegExpExecArray | null

    while ((tdMatch = tdRegex.exec(rowHtml)) !== null) {
      cells.push(tdMatch[1])
    }

    // 7 columns: 종목명 | 공모주일정 | 확정공모가 | 희망공모가 | 청약경쟁률 | 주간사 | 분석
    if (cells.length < 6) continue

    // 종목명: <a href="..."><font color='#0066CC'>company</font></a>
    const companyRaw = stripHtml(cells[0])
    if (!companyRaw || companyRaw.length < 2) continue

    // "(유가)" 같은 마켓 라벨 제거
    const company = companyRaw.replace(/\(유가\)|\(코스닥\)|\(코넥스\)/g, "").trim()

    const subscriptionDate = stripHtml(cells[1])
    const offeringPrice = stripHtml(cells[2])
    const offeringPriceRange = stripHtml(cells[3])
    const competitionRate = stripHtml(cells[4])
    const leadUnderwriter = stripHtml(cells[5])

    const status = getStatus(subscriptionDate)
    const dDay = status === "upcoming" ? getDDay(subscriptionDate) : null

    items.push({
      company,
      sector: "",
      leadUnderwriter,
      offeringPriceRange,
      offeringPrice: offeringPrice === "-" ? "" : offeringPrice,
      demandForecastDate: "",
      subscriptionDate,
      listingDate: "",
      competitionRate,
      status,
      dDay,
    })
  }

  return items
}

export async function getIpoList(): Promise<IpoItem[]> {
  const cacheKey = "ipo:38comm:list"
  const cached = cache.get<IpoItem[]>(cacheKey)
  if (cached) return cached

  try {
    const url = "http://www.38.co.kr/html/fund/?o=k"
    const res = await fetch(url, { headers: HEADERS })
    const buffer = await res.arrayBuffer()
    const html = new TextDecoder("euc-kr").decode(buffer)
    const items = parseIpoTable(html)

    cache.set(cacheKey, items, FIVE_MINUTES)
    return items
  } catch {
    return []
  }
}
