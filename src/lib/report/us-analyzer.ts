/**
 * Phase 2: US 보고서 AI 분석 파이프라인
 * 수집된 데이터를 OpenAI로 분석하여 USAnalyzedReportData를 생성한다.
 */

import OpenAI from "openai"
import type {
  USRawReportData,
  USAnalyzedReportData,
  USStockAnalysis,
  USStockReportData,
  USMarketContextData,
  USMoveReason,
} from "./us-types"
import {
  buildUSMoveAnalysisPrompt,
  buildUSExecutiveSummaryPrompt,
  buildUSPortfolioInsightPrompt,
  buildUSWatchPointsPrompt,
} from "./us-prompts"

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured")
  return new OpenAI({ apiKey })
}

async function generateAI(prompt: string): Promise<string> {
  const openai = getOpenAIClient()
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 1500,
    temperature: 0.3,
  })
  return completion.choices[0]?.message?.content ?? ""
}

function parseJSON<T>(raw: string, fallback: T): T {
  try {
    const cleaned = raw
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim()
    return JSON.parse(cleaned) as T
  } catch {
    return fallback
  }
}

function buildFallbackAnalysis(stock: USStockReportData): USStockAnalysis {
  const reasons: USMoveReason[] = []
  const q = stock.quote
  const m = stock.metrics
  const t = stock.technical

  if (q && Math.abs(q.changePercent) > 1) {
    reasons.push({
      rank: 1,
      category: "momentum",
      description:
        q.changePercent > 0
          ? `주가 ${q.changePercent.toFixed(2)}% 상승, 매수 모멘텀 지속`
          : `주가 ${Math.abs(q.changePercent).toFixed(2)}% 하락, 매도 압력`,
      impact: q.changePercent > 0 ? "positive" : "negative",
      evidence: `전일대비 $${q.change.toFixed(2)} 변동`,
    })
  }

  if (t && (t.rsi > 70 || t.rsi < 30)) {
    reasons.push({
      rank: reasons.length + 1,
      category: "technical",
      description:
        t.rsi > 70 ? "RSI 과매수 구간 진입" : "RSI 과매도 구간 진입",
      impact: t.rsi > 70 ? "negative" : "positive",
      evidence: `RSI(14): ${t.rsi.toFixed(1)}`,
    })
  }

  if (m.pe && m.pe > 0) {
    reasons.push({
      rank: reasons.length + 1,
      category: "valuation",
      description:
        m.pe > 30
          ? "고PER 밸류에이션 부담"
          : m.pe < 15
            ? "저평가 매력"
            : "적정 밸류에이션 수준",
      impact: m.pe > 30 ? "negative" : "positive",
      evidence: `PER: ${m.pe.toFixed(1)}x`,
    })
  }

  return {
    symbol: stock.symbol,
    moveReasons: reasons.slice(0, 3),
    outlook: "데이터 기반 분석을 참고하여 종합적으로 판단하세요.",
  }
}

/** 개별 종목 분석 */
async function analyzeStock(
  stock: USStockReportData,
  market: USMarketContextData,
  date: string
): Promise<USStockAnalysis> {
  if (!stock.quote) return buildFallbackAnalysis(stock)

  try {
    const prompt = buildUSMoveAnalysisPrompt(stock, market, date)
    const raw = await generateAI(prompt)
    const parsed = parseJSON<{
      reasons: USMoveReason[]
      outlook: string
    }>(raw, { reasons: [], outlook: "" })

    if (parsed.reasons.length === 0) return buildFallbackAnalysis(stock)

    return {
      symbol: stock.symbol,
      moveReasons: parsed.reasons.slice(0, 3),
      outlook: parsed.outlook || "추가 분석이 필요합니다.",
    }
  } catch {
    return buildFallbackAnalysis(stock)
  }
}

/** 전체 분석 파이프라인 */
export async function analyzeUSReportData(
  raw: USRawReportData
): Promise<USAnalyzedReportData> {
  // Sequential stock analysis (rate limit safe)
  const stockAnalyses: USStockAnalysis[] = []
  for (const stock of raw.stocks) {
    const analysis = await analyzeStock(stock, raw.market, raw.date)
    stockAnalyses.push(analysis)
  }

  // Parallel summary analyses
  const [summaryRaw, insightRaw, watchRaw] = await Promise.allSettled([
    generateAI(buildUSExecutiveSummaryPrompt(raw)),
    generateAI(buildUSPortfolioInsightPrompt(raw)),
    generateAI(buildUSWatchPointsPrompt(raw)),
  ])

  const executiveSummary =
    summaryRaw.status === "fulfilled"
      ? summaryRaw.value
      : "시장 데이터를 수집했으나 AI 요약 생성에 실패했습니다."

  const portfolioInsight =
    insightRaw.status === "fulfilled"
      ? insightRaw.value
      : "포트폴리오 분석을 생성할 수 없습니다."

  const defaultWatchPoints = ["시장 동향을 지속적으로 모니터링하세요."]
  let watchPoints = defaultWatchPoints
  if (watchRaw.status === "fulfilled") {
    const parsed = parseJSON<string[]>(watchRaw.value, defaultWatchPoints)
    if (Array.isArray(parsed) && parsed.length > 0) {
      watchPoints = parsed
    }
  }

  return {
    ...raw,
    executiveSummary,
    stockAnalyses,
    portfolioInsight,
    watchPoints,
  }
}
