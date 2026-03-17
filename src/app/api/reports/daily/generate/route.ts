import { NextRequest, NextResponse } from "next/server"
import { collectReportData } from "@/lib/report/collector"
import { analyzeReportData } from "@/lib/report/analyzer"
import { buildReportMeta } from "@/lib/report/builder"
import { cache, ONE_HOUR } from "@/lib/cache/memory-cache"
import { prisma } from "@/lib/db/prisma"
import { auth } from "../../../../../../auth"
import type { AnalyzedReportData } from "@/lib/report/types"

const MAX_TICKERS = 10

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "로그인이 필요합니다." },
      { status: 401 }
    )
  }

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
    let analyzedData: AnalyzedReportData

    if (cached) {
      analyzedData = cached
    } else {
      // Phase 1: 데이터 수집
      const rawData = await collectReportData(limitedTickers)

      // Phase 2: AI 분석
      analyzedData = await analyzeReportData(rawData)

      // 캐시 저장 (1시간)
      cache.set(cacheKey, analyzedData, ONE_HOUR)
    }

    // Phase 3: 메타데이터 생성
    const meta = buildReportMeta(analyzedData)

    // DB에 보고서 저장 (upsert: 같은 날짜 보고서는 덮어쓰기)
    await prisma.report.upsert({
      where: {
        userId_type_date: {
          userId: session.user.id,
          type: "daily",
          date: analyzedData.date,
        },
      },
      update: {
        tickers: limitedTickers,
        stockCount: analyzedData.stocks.length,
        summary: analyzedData.executiveSummary.slice(0, 500),
        data: JSON.parse(JSON.stringify(analyzedData)),
        generatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        type: "daily",
        date: analyzedData.date,
        tickers: limitedTickers,
        stockCount: analyzedData.stocks.length,
        summary: analyzedData.executiveSummary.slice(0, 500),
        data: JSON.parse(JSON.stringify(analyzedData)),
      },
    })

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
