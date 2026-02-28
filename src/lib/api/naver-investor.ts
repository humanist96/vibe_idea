import { cache, FIVE_MINUTES } from "@/lib/cache/memory-cache"
import type { InvestorFlowEntry, InvestorFlow } from "./naver-investor-types"

const HEADERS = { "User-Agent": "Mozilla/5.0" }

function parseNum(str: string): number {
  const cleaned = str.replace(/,/g, "").replace(/\+/g, "").trim()
  return Number(cleaned) || 0
}

function parsePercent(str: string): number {
  const cleaned = str.replace(/[%+]/g, "").trim()
  return parseFloat(cleaned) || 0
}

function parseInvestorTable(html: string): InvestorFlowEntry[] {
  const tableMatch = html.match(
    /<table summary="외국인 기관 순매매 거래량[^"]*"[^>]*>([\s\S]*?)<\/table>/
  )
  if (!tableMatch) return []

  const tableHtml = tableMatch[1]
  const rows: InvestorFlowEntry[] = []

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

    // Date | Close | Change direction | Change | ChangePercent | Volume | Institution | Foreign | ForeignHolding | ForeignRatio
    if (cells.length < 8) continue

    const dateRaw = cells[0].trim()
    if (!/^\d{4}\.\d{2}\.\d{2}$/.test(dateRaw)) continue

    const date = dateRaw.replace(/\./g, "-")
    const close = parseNum(cells[1])
    const changeVal = parseNum(cells[2])
    const changePercent = parsePercent(cells[3])

    // Determine sign from "상승"/"하락" img alt text or the sign prefix
    const hasDown = rowHtml.includes("하락")
    const change = hasDown ? -changeVal : changeVal

    const volume = parseNum(cells[4])
    const institutionNet = parseNum(cells[5])
    const foreignNet = parseNum(cells[6])
    const foreignHolding = parseNum(cells[7])
    const foreignRatio = cells.length >= 9 ? parsePercent(cells[8]) : 0

    rows.push({
      date,
      close,
      change,
      changePercent: hasDown ? -Math.abs(changePercent) : changePercent,
      volume,
      institutionNet,
      foreignNet,
      foreignHolding,
      foreignRatio,
    })
  }

  return rows
}

export async function getInvestorFlow(
  ticker: string,
  pages = 2
): Promise<InvestorFlow> {
  const cacheKey = `naver:investor:${ticker}`
  const cached = cache.get<InvestorFlow>(cacheKey)
  if (cached) return cached

  const allEntries: InvestorFlowEntry[] = []

  for (let page = 1; page <= pages; page++) {
    try {
      const url = `https://finance.naver.com/item/frgn.naver?code=${ticker}&page=${page}`
      const res = await fetch(url, { headers: HEADERS })
      const buffer = await res.arrayBuffer()
      const html = new TextDecoder("euc-kr").decode(buffer)
      const entries = parseInvestorTable(html)
      allEntries.push(...entries)
    } catch {
      break
    }
  }

  const result: InvestorFlow = { ticker, entries: allEntries }
  cache.set(cacheKey, result, FIVE_MINUTES)
  return result
}
