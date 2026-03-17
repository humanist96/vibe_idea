import { NextRequest, NextResponse } from "next/server"
import { collectWeeklyData } from "@/lib/report/weekly-collector"
import { analyzeWeeklyData } from "@/lib/report/weekly-analyzer"
import { cache, ONE_HOUR } from "@/lib/cache/memory-cache"
import { prisma } from "@/lib/db/prisma"
import { auth } from "../../../../../../auth"
import type { WeeklyAnalyzedData, WeeklyReportMeta } from "@/lib/report/weekly-types"

const MAX_TICKERS = 10
const TWO_HOURS = 2 * ONE_HOUR

function buildWeeklyReportMeta(report: WeeklyAnalyzedData): WeeklyReportMeta {
  return {
    id: `weekly-${report.weekStart}`,
    weekStart: report.weekStart,
    weekEnd: report.weekEnd,
    generatedAt: report.generatedAt,
    stockCount: report.stocks.length,
    summary: report.executiveSummary.slice(0, 200),
    tickers: report.stocks.map((s) => s.ticker),
  }
}

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

    if (tickers.length > MAX_TICKERS) {
      return NextResponse.json(
        { success: false, error: `최대 ${MAX_TICKERS}개 종목까지 가능합니다.` },
        { status: 400 }
      )
    }

    const sortedTickers = [...tickers].sort()
    const cacheKey = `weekly:${sortedTickers.join(",")}`

    let analyzedData: WeeklyAnalyzedData

    // 캐시된 보고서 확인
    const cached = cache.get<WeeklyAnalyzedData>(cacheKey)
    if (cached) {
      analyzedData = cached
    } else {
      // Phase 1: 주간 데이터 수집
      const rawData = await collectWeeklyData(tickers)

      // Phase 2: AI 분석
      analyzedData = await analyzeWeeklyData(rawData)

      // 캐시 저장 (2시간)
      cache.set(cacheKey, analyzedData, TWO_HOURS)
    }

    // Phase 3: 메타데이터 생성
    const meta = buildWeeklyReportMeta(analyzedData)

    // DB에 보고서 저장 (upsert)
    await prisma.report.upsert({
      where: {
        userId_type_date: {
          userId: session.user.id,
          type: "weekly",
          date: analyzedData.weekStart,
        },
      },
      update: {
        tickers: sortedTickers,
        stockCount: analyzedData.stocks.length,
        summary: analyzedData.executiveSummary.slice(0, 500),
        data: JSON.parse(JSON.stringify(analyzedData)),
        generatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        type: "weekly",
        date: analyzedData.weekStart,
        tickers: sortedTickers,
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
    console.error("Weekly report generation error:", error)
    return NextResponse.json(
      { success: false, error: "주간 보고서 생성 중 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}
