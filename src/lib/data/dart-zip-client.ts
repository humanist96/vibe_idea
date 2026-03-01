import JSZip from "jszip"
import { XMLParser } from "fast-xml-parser"

const DART_CORP_CODE_URL = "https://opendart.fss.or.kr/api/corpCode.xml"
const FETCH_TIMEOUT_MS = 60_000
const MAX_RETRIES = 2

interface CorpCodeXmlEntry {
  readonly corp_code: string
  readonly corp_name: string
  readonly stock_code: string
  readonly modify_date: string
}

function getDartApiKey(): string {
  const key = process.env.DART_API_KEY
  if (!key) {
    throw new Error("DART_API_KEY is not configured")
  }
  return key
}

function parseZipToMapping(entries: CorpCodeXmlEntry[]): Map<string, string> {
  const mapping = new Map<string, string>()
  for (const entry of entries) {
    const stockCode = String(entry.stock_code ?? "").trim()
    const corpCode = String(entry.corp_code ?? "").trim()
    if (stockCode.length === 6 && corpCode.length === 8) {
      mapping.set(stockCode, corpCode)
    }
  }
  return mapping
}

async function fetchOnce(): Promise<Map<string, string>> {
  const apiKey = getDartApiKey()
  const url = `${DART_CORP_CODE_URL}?crtfc_key=${apiKey}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)

    if (!res.ok) {
      console.error(`[DART ZIP] HTTP ${res.status} ${res.statusText}`)
      return new Map()
    }

    const buffer = await res.arrayBuffer()
    console.log(`[DART ZIP] downloaded ${(buffer.byteLength / 1024).toFixed(0)}KB`)

    const zip = await JSZip.loadAsync(buffer)

    const xmlFile = zip.file("CORPCODE.xml")
    if (!xmlFile) {
      console.error("[DART ZIP] CORPCODE.xml not found in archive")
      return new Map()
    }

    const xmlContent = await xmlFile.async("text")

    const parser = new XMLParser({
      ignoreAttributes: false,
      isArray: (name) => name === "list",
    })
    const parsed = parser.parse(xmlContent)

    const entries: CorpCodeXmlEntry[] = parsed?.result?.list ?? []
    return parseZipToMapping(entries)
  } finally {
    clearTimeout(timeout)
  }
}

export async function fetchDartCorpCodes(): Promise<Map<string, string>> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const mapping = await fetchOnce()
      if (mapping.size > 0) return mapping
      console.error(`[DART ZIP] attempt ${attempt + 1}: empty result`)
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      console.error(`[DART ZIP] attempt ${attempt + 1} failed: ${msg}`)
    }

    if (attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
    }
  }

  console.error("[DART ZIP] all attempts exhausted, returning empty map")
  return new Map()
}
