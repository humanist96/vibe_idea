import { cache, FIVE_MINUTES } from "@/lib/cache/memory-cache"

const HEADERS = { "User-Agent": "Mozilla/5.0" }

export interface ShortSellingEntry {
  readonly date: string
  readonly close: number
  readonly shortVolume: number
  readonly shortAmount: number
  readonly shortRatio: number
}

export interface ShortSellingData {
  readonly ticker: string
  readonly entries: readonly ShortSellingEntry[]
}

function parseNum(str: string): number {
  const cleaned = str.replace(/,/g, "").replace(/\+/g, "").trim()
  return Number(cleaned) || 0
}

function parsePercent(str: string): number {
  const cleaned = str.replace(/[%+]/g, "").trim()
  return parseFloat(cleaned) || 0
}

function parseShortSellingTable(html: string): ShortSellingEntry[] {
  const tableMatch = html.match(
    /<table[^>]*summary="공매도 거래[^"]*"[^>]*>([\s\S]*?)<\/table>/
  )
  if (!tableMatch) {
    const fallbackMatch = html.match(
      /<table[^>]*class="type2"[^>]*>([\s\S]*?)<\/table>/
    )
    if (!fallbackMatch) return []
    return parseTableRows(fallbackMatch[1])
  }
  return parseTableRows(tableMatch[1])
}

function parseTableRows(tableHtml: string): ShortSellingEntry[] {
  const rows: ShortSellingEntry[] = []
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g
  let trMatch: RegExpExecArray | null

  while ((trMatch = trRegex.exec(tableHtml)) !== null) {
    const rowHtml = trMatch[1]
    if (rowHtml.includes("<th")) continue

    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/g
    const cells: string[] = []
    let tdMatch: RegExpExecArray | null

    while ((tdMatch = tdRegex.exec(rowHtml)) !== null) {
      const text = tdMatch[1].replace(/<[^>]*>/g, "").trim()
      cells.push(text)
    }

    if (cells.length < 5) continue

    const dateRaw = cells[0].trim()
    if (!/^\d{4}\.\d{2}\.\d{2}$/.test(dateRaw)) continue

    const date = dateRaw.replace(/\./g, "-")
    const close = parseNum(cells[1])
    const shortVolume = parseNum(cells[2])
    const shortAmount = parseNum(cells[3])
    const shortRatio = parsePercent(cells[4])

    rows.push({ date, close, shortVolume, shortAmount, shortRatio })
  }

  return rows
}

export async function getShortSelling(
  ticker: string,
  pages = 2
): Promise<ShortSellingData> {
  const cacheKey = `naver:short-selling:${ticker}`
  const cached = cache.get<ShortSellingData>(cacheKey)
  if (cached) return cached

  const allEntries: ShortSellingEntry[] = []

  for (let page = 1; page <= pages; page++) {
    try {
      const url = `https://finance.naver.com/item/sise_short.naver?code=${ticker}&page=${page}`
      const res = await fetch(url, { headers: HEADERS })
      const buffer = await res.arrayBuffer()
      const html = new TextDecoder("euc-kr").decode(buffer)
      const entries = parseShortSellingTable(html)
      allEntries.push(...entries)
    } catch {
      break
    }
  }

  const result: ShortSellingData = { ticker, entries: allEntries }
  cache.set(cacheKey, result, FIVE_MINUTES)
  return result
}
