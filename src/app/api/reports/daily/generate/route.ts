import { NextRequest, NextResponse } from "next/server"
import { collectReportData } from "@/lib/report/collector"
import { analyzeReportData } from "@/lib/report/analyzer"
import { buildReportMeta } from "@/lib/report/builder"
import { cache, ONE_HOUR } from "@/lib/cache/memory-cache"
import type { AnalyzedReportData, ReportProgress } from "@/lib/report/types"

const MAX_TICKERS = 10

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const tickers: string[] = body.tickers

    if (!tickers || !Array.isArray(tickers) || tickers.length === 0) {
      return NextResponse.json(
        { success: false, error: "관심종목을 1개 이상 입력해주세요." },
        { status: 400 }
      )
    }

    const limitedTickers = tickers.slice(0, MAX_TICKERS)
    const cacheKey = `report:daily:${limitedTickers.sort().join(",")}`

    // 캐시된 보고서 확인
    const cached = cache.get<AnalyzedReportData>(cacheKey)
    if (cached) {
      const meta = buildReportMeta(cached)
      return NextResponse.json({
        success: true,
        data: { meta, report: cached },
      })
    }

    // Phase 1: 데이터 수집
    const rawData = await collectReportData(limitedTickers)

    // Phase 2: AI 분석
    const analyzedData = await analyzeReportData(rawData)

    // Phase 3: 메타데이터 생성
    const meta = buildReportMeta(analyzedData)

    // 캐시 저장 (1시간)
    cache.set(cacheKey, analyzedData, ONE_HOUR)

    return NextResponse.json({
      success: true,
      data: { meta, report: analyzedData },
    })
  } catch (error) {
    console.error("Report generation error:", error)
    return NextResponse.json(
      { success: false, error: "보고서 생성 중 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}
