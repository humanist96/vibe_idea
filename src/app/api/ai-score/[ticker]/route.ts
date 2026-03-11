import { NextResponse, type NextRequest } from "next/server"
import { auth } from "../../../../../auth"
import { getAIScore } from "@/lib/ai/scoring"
import { ensureLoaded, findStock } from "@/lib/data/stock-registry"
import { isValidTicker } from "@/lib/api/validate-ticker"
import { checkRateLimit, AI_SCORE_RATE_LIMIT } from "@/lib/api/rate-limit"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "로그인이 필요합니다." },
      { status: 401 }
    )
  }

  const { allowed } = checkRateLimit(`ai-score:${session.user.id ?? session.user.email}`, AI_SCORE_RATE_LIMIT)
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
      { status: 429 }
    )
  }

  try {
    const { ticker } = await params

    if (!isValidTicker(ticker, "KR")) {
      return NextResponse.json(
        { success: false, error: "올바르지 않은 종목 코드입니다." },
        { status: 400 }
      )
    }

    await ensureLoaded()
    const stock = findStock(ticker)
    if (!stock) {
      return NextResponse.json(
        { success: false, error: "종목을 찾을 수 없습니다." },
        { status: 404 }
      )
    }

    const score = await getAIScore(ticker)

    if (!score) {
      return NextResponse.json(
        { success: false, error: "AI 분석을 수행할 수 없습니다." },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: score })
  } catch {
    return NextResponse.json(
      { success: false, error: "AI 분석 중 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}
