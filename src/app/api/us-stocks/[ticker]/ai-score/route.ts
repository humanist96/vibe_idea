import OpenAI from "openai"
import { NextResponse, type NextRequest } from "next/server"
import { cache, ONE_HOUR } from "@/lib/cache/memory-cache"
import { getUSQuote, getUSMetrics, getUSNews, getUSCandle } from "@/lib/api/finnhub"
import { getGoogleNews } from "@/lib/api/google-news"
import { findUSStock } from "@/lib/data/us-stock-registry"
import { calculateTechnicalIndicators, getTechnicalScore } from "@/lib/analysis/technical"
import { getFundamentalScore } from "@/lib/analysis/fundamental"
import { analyzeNewsSentiment } from "@/lib/analysis/sentiment"
import { getRatingFromScore, type AIScore, type Factor } from "@/lib/ai/score-schema"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const SYSTEM_PROMPT = `You are an expert US stock analyst. Analyze the given stock data and provide a comprehensive AI score.

Return format (JSON only):
{
  "aiScore": 1~10 (overall score, 10 is best),
  "rating": "Strong Buy" | "Buy" | "Hold" | "Sell" | "Strong Sell",
  "probability": 0~100 (outperformance probability),
  "technicalScore": 1~10,
  "fundamentalScore": 1~10,
  "sentimentScore": 1~10,
  "riskScore": 1~10 (10 = lowest risk),
  "factors": [
    { "name": "factor description in Korean", "impact": "positive" | "negative" | "neutral", "strength": 1~5 }
  ] (minimum 3, maximum 10),
  "summary": "Korean language summary 2~3 sentences",
  "keyInsight": "Korean language key insight 1 sentence"
}

Rules:
- Score based on technicals, fundamentals, sentiment, risk
- factors must be in Korean
- summary and keyInsight in Korean
- Valid JSON only`

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await params
    const symbol = ticker.toUpperCase()

    const cacheKey = `us-ai-score:${symbol}`
    const cached = cache.get<AIScore>(cacheKey)
    if (cached) {
      return NextResponse.json({ success: true, data: cached })
    }

    const registry = findUSStock(symbol)
    const stockName = registry?.nameKr ?? registry?.name ?? symbol

    const [quoteResult, metricsResult, candleResult, newsResult, googleNewsResult] =
      await Promise.allSettled([
        getUSQuote(symbol),
        getUSMetrics(symbol),
        getUSCandle(symbol, "D"),
        getUSNews(symbol, 7),
        getGoogleNews(stockName),
      ])

    const quote = quoteResult.status === "fulfilled" ? quoteResult.value : null
    const metrics = metricsResult.status === "fulfilled" ? metricsResult.value : null
    const candle = candleResult.status === "fulfilled" ? candleResult.value : null
    const news = newsResult.status === "fulfilled" ? newsResult.value : []
    const googleNews = googleNewsResult.status === "fulfilled" ? googleNewsResult.value : []

    if (!quote || quote.c === 0) {
      return NextResponse.json(
        { success: false, error: "US stock data not found" },
        { status: 404 }
      )
    }

    // Build technical indicators from candle data
    let technicalIndicators = undefined
    if (candle && candle.s === "ok" && candle.c.length > 20) {
      const ohlcv = candle.c.map((close, i) => ({
        close,
        high: candle.h[i],
        low: candle.l[i],
        volume: candle.v[i],
      }))
      technicalIndicators = calculateTechnicalIndicators(ohlcv)
    }

    // News sentiment
    const allHeadlines = [
      ...news.map((n) => ({ title: n.headline, url: n.url })),
      ...googleNews.slice(0, 5).map((n) => ({ title: n.title, url: n.url })),
    ]
    const newsSentiment =
      allHeadlines.length > 0
        ? analyzeNewsSentiment(allHeadlines.map((h) => ({ title: h.title, url: h.url, source: "", publishedAt: "" })))
        : null

    const m = metrics?.metric
    const dataSources = {
      quote: true,
      technical: !!technicalIndicators,
      dart: false,
      financials: !!m,
      naverNews: false,
      googleNews: googleNews.length > 0,
    }

    try {
      const parts = [
        `Stock: ${stockName}(${symbol})`,
        `Price: $${quote.c}`,
        `Change: ${quote.dp > 0 ? "+" : ""}${quote.dp.toFixed(2)}%`,
        m?.peAnnual != null ? `P/E: ${m.peAnnual}` : null,
        m?.pbAnnual != null ? `P/B: ${m.pbAnnual}` : null,
        m?.epsAnnual != null ? `EPS: $${m.epsAnnual}` : null,
        m?.dividendYieldIndicatedAnnual != null ? `Dividend Yield: ${m.dividendYieldIndicatedAnnual}%` : null,
        m?.marketCapitalization ? `Market Cap: $${(m.marketCapitalization * 1_000_000).toLocaleString()}` : null,
        m?.roeTTM != null ? `ROE: ${m.roeTTM}%` : null,
        m?.beta != null ? `Beta: ${m.beta}` : null,
        m?.["52WeekHigh"] != null ? `52W High: $${m["52WeekHigh"]}` : null,
        m?.["52WeekLow"] != null ? `52W Low: $${m["52WeekLow"]}` : null,
        technicalIndicators ? `RSI: ${technicalIndicators.rsi.toFixed(1)}` : null,
        technicalIndicators ? `MACD: ${technicalIndicators.macdHistogram > 0 ? "Bullish" : "Bearish"}` : null,
        technicalIndicators ? `Price vs SMA200: ${technicalIndicators.priceVsSma200 > 0 ? "Above" : "Below"}` : null,
        newsSentiment ? `News Sentiment: ${newsSentiment.overallScore}/10 (${newsSentiment.positiveCount}P/${newsSentiment.negativeCount}N/${newsSentiment.neutralCount}U)` : null,
        allHeadlines.length > 0 ? `Recent Headlines:\n${allHeadlines.slice(0, 5).map((h) => `- ${h.title}`).join("\n")}` : null,
        registry?.sector ? `Sector: ${registry.sector}` : null,
      ].filter(Boolean).join("\n")

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Analyze this US stock:\n\n${parts}` },
        ],
        temperature: 0.2,
        max_tokens: 800,
      })

      const content = completion.choices[0]?.message?.content?.trim()
      if (!content) throw new Error("No AI response")

      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error("No JSON found")

      const parsed = JSON.parse(jsonMatch[0])
      const score: AIScore = {
        ...parsed,
        dataSources,
        newsHeadlines: allHeadlines.slice(0, 5).map((h) => h.title),
        analyzedAt: new Date().toISOString(),
      }

      cache.set(cacheKey, score, ONE_HOUR)
      return NextResponse.json({ success: true, data: score })
    } catch {
      // Fallback to algorithmic scoring
      const techScore = technicalIndicators ? getTechnicalScore(technicalIndicators) : 5
      const fundScore = m
        ? getFundamentalScore({
            per: m.peAnnual ?? null,
            pbr: m.pbAnnual ?? null,
            eps: m.epsAnnual ?? null,
            dividendYield: m.dividendYieldIndicatedAnnual ?? null,
            marketCap: m.marketCapitalization ? m.marketCapitalization * 1_000_000 : 0,
            priceChange52w: quote.dp,
          })
        : 5
      const sentimentScore = newsSentiment ? newsSentiment.overallScore : 5
      const riskScore = 5

      const aiScore = Math.round((techScore * 0.3 + fundScore * 0.3 + sentimentScore * 0.2 + riskScore * 0.2) * 10) / 10

      const factors: Factor[] = []
      if (technicalIndicators) {
        if (technicalIndicators.rsi < 30) factors.push({ name: "RSI 과매도 구간", impact: "positive", strength: 4 })
        else if (technicalIndicators.rsi > 70) factors.push({ name: "RSI 과매수 구간", impact: "negative", strength: 4 })
        if (technicalIndicators.macdHistogram > 0) factors.push({ name: "MACD 상승 신호", impact: "positive", strength: 3 })
        else factors.push({ name: "MACD 하락 신호", impact: "negative", strength: 3 })
        if (technicalIndicators.priceVsSma200 > 0) factors.push({ name: "200일 이평선 위 위치", impact: "positive", strength: 3 })
        else factors.push({ name: "200일 이평선 아래 위치", impact: "negative", strength: 3 })
      }
      if (m?.peAnnual != null && m.peAnnual > 0 && m.peAnnual < 15) {
        factors.push({ name: "PER 저평가 구간", impact: "positive", strength: 4 })
      }
      if (m?.dividendYieldIndicatedAnnual != null && m.dividendYieldIndicatedAnnual > 3) {
        factors.push({ name: "높은 배당수익률", impact: "positive", strength: 3 })
      }
      if (factors.length < 3) {
        factors.push({ name: "데이터 제한으로 부분 분석", impact: "neutral", strength: 2 })
      }

      const fallback: AIScore = {
        aiScore,
        rating: getRatingFromScore(aiScore),
        probability: Math.round(aiScore * 8 + 10),
        technicalScore: techScore,
        fundamentalScore: fundScore,
        sentimentScore,
        riskScore,
        factors,
        summary: `${stockName} 종목에 대한 알고리즘 기반 분석 결과입니다. 기술적/재무적 지표 기반으로 점수를 산출했습니다.`,
        keyInsight: "알고리즘 기반 분석 점수입니다.",
        dataSources,
        newsHeadlines: allHeadlines.slice(0, 5).map((h) => h.title),
        analyzedAt: new Date().toISOString(),
      }

      cache.set(cacheKey, fallback, ONE_HOUR)
      return NextResponse.json({ success: true, data: fallback })
    }
  } catch (error) {
    console.error("US AI Score API error:", error)
    return NextResponse.json(
      { success: false, error: "AI analysis failed" },
      { status: 500 }
    )
  }
}
