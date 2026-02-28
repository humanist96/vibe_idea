import JSZip from "jszip"
import { XMLParser } from "fast-xml-parser"

const DART_CORP_CODE_URL = "https://opendart.fss.or.kr/api/corpCode.xml"

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

export async function fetchDartCorpCodes(): Promise<Map<string, string>> {
  try {
    const apiKey = getDartApiKey()
    const url = `${DART_CORP_CODE_URL}?crtfc_key=${apiKey}`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)

    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)

    if (!res.ok) return new Map()

    const buffer = await res.arrayBuffer()
    const zip = await JSZip.loadAsync(buffer)

    const xmlFile = zip.file("CORPCODE.xml")
    if (!xmlFile) return new Map()

    const xmlContent = await xmlFile.async("text")

    const parser = new XMLParser({
      ignoreAttributes: false,
      isArray: (name) => name === "list",
    })
    const parsed = parser.parse(xmlContent)

    const entries: CorpCodeXmlEntry[] = parsed?.result?.list ?? []

    const mapping = new Map<string, string>()
    for (const entry of entries) {
      const stockCode = String(entry.stock_code ?? "").trim()
      const corpCode = String(entry.corp_code ?? "").trim()
      if (stockCode.length === 6 && corpCode.length === 8) {
        mapping.set(stockCode, corpCode)
      }
    }

    return mapping
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("DART ZIP download failed:", error)
    }
    return new Map()
  }
}
