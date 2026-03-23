import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { auth } from "../../../../../auth"
import { prisma } from "@/lib/db/prisma"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

/**
 * GET /api/reports/weekly — 로그인 사용자의 주간 보고서 목록
 */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "로그인이 필요합니다." },
      { status: 401 }
    )
  }

  const reports = await prisma.report.findMany({
    where: { userId: session.user.id, type: "weekly" },
    select: {
      id: true,
      date: true,
      stockCount: true,
      summary: true,
      tickers: true,
      generatedAt: true,
      data: true,
    },
    orderBy: { generatedAt: "desc" },
    take: 12,
  })

  return NextResponse.json({
    success: true,
    data: reports.map((r) => {
      const reportData = r.data as Record<string, unknown>
      return {
        id: `weekly-${r.date}`,
        weekStart: r.date,
        weekEnd: (reportData?.weekEnd as string) ?? r.date,
        generatedAt: r.generatedAt.toISOString(),
        stockCount: r.stockCount,
        summary: r.summary,
        tickers: r.tickers,
      }
    }),
  })
}

/**
 * POST /api/reports/weekly — 마이페이지 주간 AI 브리핑 생성
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "로그인이 필요합니다." },
      { status: 401 }
    )
  }

  try {
    const body = await req.json()
    const portfolio: Array<{ ticker: string; name: string; changePercent: number; currentPrice: number }> =
      body.portfolio ?? []

    if (portfolio.length === 0) {
      return NextResponse.json(
        { success: false, error: "포트폴리오 데이터가 없습니다." },
        { status: 400 }
      )
    }

    const portfolioSummary = portfolio
      .map((p) => `${p.name}(${p.ticker}): 현재가 ${p.currentPrice.toLocaleString()}원, 주간 ${p.changePercent >= 0 ? "+" : ""}${p.changePercent.toFixed(1)}%`)
      .join("\n")

    // KST 기준 날짜 산출
    const kstNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }))
    const kstMonth = kstNow.getMonth() + 1
    const kstDate = kstNow.getDate()
    const weekOfMonth = Math.ceil(kstDate / 7)
    const weekTitle = `${kstMonth}월 ${weekOfMonth}째주 브리핑`

    const kstDateStr = `${kstNow.getFullYear()}-${String(kstMonth).padStart(2, "0")}-${String(kstDate).padStart(2, "0")}`

    const prompt = `오늘은 ${kstDateStr}입니다. 아래는 사용자의 포트폴리오 종목 주간 현황입니다.

${portfolioSummary}

위 데이터를 기반으로 ${weekTitle}을 JSON으로 생성하세요.

예시:
{"weekTitle":"${weekTitle}","marketReview":{"sentiment":"중립","highlights":["주요 이벤트1","주요 이벤트2"],"summary":"시장 요약 1~2문장"},"portfolioReview":{"totalReturn":"+2.3%","bestPick":{"name":"종목명","reason":"이유"},"worstPick":{"name":"종목명","reason":"이유"},"grade":"B"},"nextWeekOutlook":{"events":["이벤트1"],"watchList":["주목 포인트1","주목 포인트2"],"strategy":"전략 1~2문장"},"actionItems":[{"priority":"높음","action":"행동1"},{"priority":"보통","action":"행동2"}],"quote":"투자 관련 명언 한 줄"}

sentiment: "강세", "중립", "약세" 중 하나
grade: "A", "B", "C", "D" 중 하나
priority: "높음", "보통" 중 하나
totalReturn은 포트폴리오 전체 주간 수익률 추정치`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "당신은 주간 투자 브리핑 AI입니다. 반드시 유효한 JSON만 반환하세요." },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 800,
      response_format: { type: "json_object" },
    })

    const content = completion.choices[0]?.message?.content?.trim()
    if (!content) {
      return NextResponse.json({ success: false, error: "AI 응답 없음" }, { status: 500 })
    }

    let data: Record<string, unknown>
    try {
      data = JSON.parse(content)
    } catch {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return NextResponse.json({ success: false, error: "AI 응답 파싱 실패" }, { status: 500 })
      }
      data = JSON.parse(jsonMatch[0].replace(/,\s*([}\]])/g, "$1"))
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Weekly briefing error:", error)
    const msg = error instanceof Error ? error.message : "알 수 없는 오류"
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
