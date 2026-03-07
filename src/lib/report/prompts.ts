/**
 * AI 프롬프트 템플릿 — OpenAI GPT-4o-mini용
 */

import type { StockReportData, MarketContextData } from "./types"
import type { AnalyzedReportData } from "./types"

/** 종목별 등락 원인 분석 프롬프트 */
export function buildMoveAnalysisPrompt(
  stock: StockReportData,
  market: MarketContextData,
  date: string
): string {
  const q = stock.quote
  if (!q) return ""

  const kospi = market.indices.find((i) => i.name === "KOSPI")
  const kospiChange = kospi ? `${kospi.changePercent >= 0 ? "+" : ""}${kospi.changePercent.toFixed(2)}%` : "N/A"

  const flow = stock.investorFlow?.entries?.[0]
  const foreignNet = flow?.foreignNet ?? 0
  const institutionNet = flow?.institutionNet ?? 0
  const foreignRatio = flow?.foreignRatio ?? 0

  const tech = stock.technical
  const rsi = tech?.rsi?.toFixed(1) ?? "N/A"
  const macd = tech?.macdHistogram?.toFixed(0) ?? "N/A"
  const sma20diff = tech?.priceVsSma20?.toFixed(2) ?? "N/A"

  const sent = stock.sentiment
  const positive = sent?.positiveCount ?? 0
  const negative = sent?.negativeCount ?? 0

  const headlines = stock.news.slice(0, 5).map((n) => `- ${n.title}`).join("\n")
  const eventList = stock.events.length > 0
    ? stock.events.slice(0, 3).map((e) => `- [${e.category}] ${e.reportName}`).join("\n")
    : "없음"

  const avgVolume = stock.historical.length >= 5
    ? Math.round(stock.historical.slice(0, -1).reduce((s, h) => s + h.volume, 0) / Math.max(stock.historical.length - 1, 1))
    : q.volume
  const volumeRatio = avgVolume > 0 ? (q.volume / avgVolume).toFixed(1) : "N/A"

  return `당신은 한국 주식 시장 전문 애널리스트입니다.
아래 데이터를 바탕으로 ${stock.name}(${stock.ticker})의 ${date} 등락 원인을 분석하세요.

## 제공 데이터
- 가격: 종가 ${q.price.toLocaleString("ko-KR")}원, 전일대비 ${q.change >= 0 ? "+" : ""}${q.change.toLocaleString("ko-KR")}원 (${q.changePercent >= 0 ? "+" : ""}${q.changePercent.toFixed(2)}%)
- 거래량: ${q.volume.toLocaleString("ko-KR")}주 (20일 평균 대비 ${volumeRatio}배)
- 외국인: 순매수 ${foreignNet.toLocaleString("ko-KR")}주, 보유비율 ${foreignRatio}%
- 기관: 순매수 ${institutionNet.toLocaleString("ko-KR")}주
- 기술 지표: RSI ${rsi}, MACD 히스토그램 ${macd}, SMA20 대비 ${sma20diff}%
- 뉴스 감성: 긍정 ${positive}건, 부정 ${negative}건
- 시장: KOSPI ${kospiChange}

## 뉴스 헤드라인
${headlines || "없음"}

## 공시
${eventList}

## 출력 형식 (반드시 JSON만 출력)
{
  "reasons": [
    {
      "rank": 1,
      "category": "supply_demand | news | technical | sector | macro | event",
      "description": "원인 설명 (1문장)",
      "impact": "positive | negative",
      "evidence": "근거 데이터 (구체적 수치 포함)"
    }
  ],
  "outlook": "오늘 전망 (1-2문장)"
}

반드시 3개의 원인을 중요도 순으로 나열하세요.
반드시 제공된 데이터에 근거하여 분석하세요. 추측 금지.`
}

/** Executive Summary 프롬프트 */
export function buildExecutiveSummaryPrompt(
  stocks: readonly StockReportData[],
  market: MarketContextData,
  date: string
): string {
  const stockSummaries = stocks
    .filter((s) => s.quote)
    .map((s) => {
      const q = s.quote!
      const flow = s.investorFlow?.entries?.[0]
      const foreignLabel = flow ? (flow.foreignNet > 0 ? "외국인 순매수" : "외국인 순매도") : ""
      return `- ${s.name}: ${q.changePercent >= 0 ? "+" : ""}${q.changePercent.toFixed(2)}% ${foreignLabel}`
    })
    .join("\n")

  const kospi = market.indices.find((i) => i.name === "KOSPI")
  const kosdaq = market.indices.find((i) => i.name === "KOSDAQ")
  const kospiStr = kospi ? `KOSPI ${kospi.changePercent >= 0 ? "+" : ""}${kospi.changePercent.toFixed(2)}%` : ""
  const kosdaqStr = kosdaq ? `KOSDAQ ${kosdaq.changePercent >= 0 ? "+" : ""}${kosdaq.changePercent.toFixed(2)}%` : ""
  const fearGreed = market.fearGreed ? `공포탐욕지수 ${market.fearGreed.score}(${market.fearGreed.label})` : ""

  return `아래는 ${date} 관심종목 ${stocks.length}개의 일간 분석 데이터입니다.

## 시장
${kospiStr}, ${kosdaqStr}, ${fearGreed}

## 관심종목 등락
${stockSummaries}

한국 주식 시장 투자자를 위한 데일리 브리핑을 2-3문장으로 작성하세요.
- 전체 관심종목의 동향 요약
- 가장 주목할 만한 움직임
- 시장 맥락과의 연관성

간결하고 사실에 근거하여 작성하세요. JSON이 아닌 일반 텍스트로 응답하세요.`
}

/** 포트폴리오 인사이트 프롬프트 */
export function buildPortfolioInsightPrompt(
  stocks: readonly StockReportData[]
): string {
  const data = stocks
    .filter((s) => s.quote)
    .map((s) => {
      const q = s.quote!
      const ai = s.aiScore
      return `- ${s.name}(${s.ticker}): 등락 ${q.changePercent >= 0 ? "+" : ""}${q.changePercent.toFixed(2)}%, AI점수 ${ai?.aiScore ?? "N/A"}, 시총 ${(q.marketCap / 1e12).toFixed(1)}조원`
    })
    .join("\n")

  return `아래는 사용자의 관심종목 포트폴리오 데이터입니다.

${data}

포트폴리오 관점에서 분석하세요:
1. 종목 다각화 평가
2. 리스크 집중 요인
3. 개선 제안 (1가지)

3-4문장으로 간결하게 작성하세요. JSON이 아닌 일반 텍스트로 응답하세요.`
}

/** 오늘의 주목 포인트 프롬프트 */
export function buildWatchPointsPrompt(
  stocks: readonly StockReportData[],
  market: MarketContextData
): string {
  const techSignals = stocks
    .filter((s) => s.technical && s.quote)
    .map((s) => {
      const t = s.technical!
      const q = s.quote!
      const signals: string[] = []
      if (t.rsi > 70) signals.push("RSI 과매수")
      if (t.rsi < 30) signals.push("RSI 과매도")
      if (t.macdHistogram > 0 && t.macdLine > t.macdSignal) signals.push("MACD 골든크로스")
      if (t.macdHistogram < 0 && t.macdLine < t.macdSignal) signals.push("MACD 데드크로스")
      if (q.price > t.sma200) signals.push("SMA200 위")
      return signals.length > 0 ? `- ${s.name}: ${signals.join(", ")}` : null
    })
    .filter(Boolean)
    .join("\n")

  const events = stocks
    .flatMap((s) => s.events.map((e) => `- ${s.name}: ${e.reportName}`))
    .slice(0, 3)
    .join("\n")

  return `아래 관심종목의 기술적 시그널과 예정된 이벤트를 기반으로 오늘 주목할 포인트를 작성하세요.

## 기술적 시그널
${techSignals || "특이 시그널 없음"}

## 예정 이벤트/공시
${events || "없음"}

3-5개의 주목 포인트를 한 줄씩 작성하세요.
반드시 아래 JSON 형식으로만 응답하세요:
["주목 포인트 1", "주목 포인트 2", "주목 포인트 3"]`
}
