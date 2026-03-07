import { cache, FIVE_MINUTES } from "@/lib/cache/memory-cache"

const HEADERS = { "User-Agent": "Mozilla/5.0" }

export interface ProgramTradingEntry {
  readonly date: string
  readonly close: number
  readonly programBuy: number
  readonly programSell: number
  readonly programNet: number
}

export interface ProgramTradingData {
  readonly ticker: string
  readonly entries: readonly ProgramTradingEntry[]
}

function parseNum(str: string): number {
  const cleaned = str.replace(/,/g, "").replace(/\+/g, "").trim()
  return Number(cleaned) || 0
}

function parseProgramTable(html: string): ProgramTradingEntry[] {
  const tableMatch = html.match(
    /<table[^>]*summary="프로그램 매매[^"]*"[^>]*>([\s\S]*?)<\/table>/
  )
  if (!tableMatch) {
    const fallbackMatch = html.match(
      /<table[^>]*class="type2"[^>]*>([\s\S]*?)<\/table>/
    )
    if (!fallbackMatch) return []
    return parseProgramRows(fallbackMatch[1])
  }
  return parseProgramRows(tableMatch[1])
}

function parseProgramRows(tableHtml: string): ProgramTradingEntry[] {
  const rows: ProgramTradingEntry[] = []
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
    const programBuy = parseNum(cells[2])
    const programSell = parseNum(cells[3])
    const programNet = parseNum(cells[4])

    rows.push({ date, close, programBuy, programSell, programNet })
  }

  return rows
}

export async function getProgramTrading(
  ticker: string,
  pages = 2
): Promise<ProgramTradingData> {
  const cacheKey = `naver:program:${ticker}`
  const cached = cache.get<ProgramTradingData>(cacheKey)
  if (cached) return cached

  const allEntries: ProgramTradingEntry[] = []

  for (let page = 1; page <= pages; page++) {
    try {
      const url = `https://finance.naver.com/item/sise_program.naver?code=${ticker}&page=${page}`
      const res = await fetch(url, { headers: HEADERS })
      const buffer = await res.arrayBuffer()
      const html = new TextDecoder("euc-kr").decode(buffer)
      const entries = parseProgramTable(html)
      allEntries.push(...entries)
    } catch {
      break
    }
  }

  const result: ProgramTradingData = { ticker, entries: allEntries }
  cache.set(cacheKey, result, FIVE_MINUTES)
  return result
}
