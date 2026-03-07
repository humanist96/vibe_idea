import { NextResponse } from "next/server"
import { collectUSReportData } from "@/lib/report/us-collector"
import { analyzeUSReportData } from "@/lib/report/us-analyzer"
import { cache } from "@/lib/cache/memory-cache"
import type { USAnalyzedReportData, USReportMeta } from "@/lib/report/us-types"

const ONE_HOUR = 3600 * 1000

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const symbols: string[] = body.symbols ?? []

    if (symbols.length === 0) {
      return NextResponse.json(
        { success: false, error: "symbols required" },
        { status: 400 }
      )
    }

    const sorted = [...symbols].sort().join(",")
    const cacheKey = `us-report:daily:${sorted}`
    const cached = cache.get<{ meta: USReportMeta; report: USAnalyzedReportData }>(cacheKey)
    if (cached) {
      return NextResponse.json({ success: true, data: cached })
    }

    // Phase 1: Collect data
    const raw = await collectUSReportData(symbols)

    // Phase 2: AI analysis
    const analyzed = await analyzeUSReportData(raw)

    // Phase 3: Build metadata
    const reportId = `us-${analyzed.date}-${Date.now()}`
    const meta: USReportMeta = {
      id: reportId,
      date: analyzed.date,
      generatedAt: analyzed.generatedAt,
      stockCount: analyzed.stocks.length,
      summary: analyzed.executiveSummary.slice(0, 150) + "...",
      symbols: analyzed.stocks.map((s) => s.symbol),
    }

    const result = { meta, report: analyzed }
    cache.set(cacheKey, result, ONE_HOUR)

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
