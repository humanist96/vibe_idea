/**
 * 주간 보고서 AI 프롬프트 템플릿 — OpenAI GPT-4o-mini용
 */

import type { WeeklyStockData, WeeklyMarketData } from "./weekly-types"

/** 종목별 주간 분석 프롬프트 */
export function buildWeeklyStockPrompt(
  stock: WeeklyStockData,
  market: WeeklyMarketData
): string {
  const kospi = market.indices.find((i) => i.name === "KOSPI")
  const kospiChange = kospi
    ? `${kospi.weekChangePercent >= 0 ? "+" : ""}${kospi.weekChangePercent.toFixed(2)}%`
    : "N/A"

  const tech = stock.technical
  const rsi = tech?.rsi?.toFixed(1) ?? "N/A"
  const macd = tech?.macdHistogram?.toFixed(0) ?? "N/A"
  const sma20diff = tech?.priceVsSma20?.toFixed(2) ?? "N/A"

  const sent = stock.sentiment
  const positive = sent?.positiveCount ?? 0
  const negative = sent?.negativeCount ?? 0

  const headlines = stock.news
    .slice(0, 5)
    .map((n) => `- ${n.title}`)
    .join("\n")

  const consensusInfo = stock.consensusEnd
  const targetPrice = consensusInfo?.targetPrice
  const targetUpside = targetPrice
    ? (((targetPrice - stock.weekClose) / stock.weekClose) * 100).toFixed(1)
    : "N/A"
  const opinion = consensusInfo?.investmentOpinion ?? "N/A"
  const analystCount = consensusInfo?.analystCount ?? 0

  const fearGreedChange = market.fearGreedStart !== null && market.fearGreedEnd !== null
    ? `${market.fearGreedStart} → ${market.fearGreedEnd}`
    : "N/A"

  const sectorSummary = market.sectorPerformance
    .slice(0, 5)
    .map((s) => `- ${s.sector}: ${s.changePercent >= 0 ? "+" : ""}${s.changePercent.toFixed(2)}% (대장주: ${s.topStock})`)
    .join("\n")

  return `당신은 한국 주식 시장 전문 애널리스트입니다.
아래 주간 데이터를 바탕으로 ${stock.name}(${stock.ticker})의 주간 동향을 분석하세요.

## 주간 가격 데이터
- 시가: ${stock.weekOpen.toLocaleString("ko-KR")}원 → 종가: ${stock.weekClose.toLocaleString("ko-KR")}원
- 주간 등락: ${stock.weekChange >= 0 ? "+" : ""}${stock.weekChange.toLocaleString("ko-KR")}원 (${stock.weekChangePercent >= 0 ? "+" : ""}${stock.weekChangePercent.toFixed(2)}%)
- 주간 고가: ${stock.weekHigh.toLocaleString("ko-KR")}원, 저가: ${stock.weekLow.toLocaleString("ko-KR")}원

## 주간 수급
- 거래량 합산: ${stock.weekVolume.toLocaleString("ko-KR")}주
- 외국인 순매수 합산: ${stock.weekForeignNet.toLocaleString("ko-KR")}주
- 기관 순매수 합산: ${stock.weekInstitutionNet.toLocaleString("ko-KR")}주

## 기술 지표 (금요일 기준)
- RSI: ${rsi}, MACD 히스토그램: ${macd}, SMA20 대비: ${sma20diff}%

## 뉴스 감성 (주간)
- 긍정 ${positive}건, 부정 ${negative}건

## 시장 맥락
- KOSPI 주간 등락: ${kospiChange}
- 공포탐욕지수: ${fearGreedChange}

## 섹터 주간 성과
${sectorSummary || "없음"}

## 주요 뉴스 헤드라인 (주간 Top 5)
${headlines || "없음"}

## 애널리스트 컨센서스
- 투자의견: ${opinion} (애널리스트 ${analystCount}명)
- 목표가: ${targetPrice ? targetPrice.toLocaleString("ko-KR") + "원" : "N/A"} (현재가 대비 ${targetUpside}%)

## 출력 형식 (반드시 JSON만 출력)
{
  "weekSummary": "주간 동향 요약 (2-3문장, 가격/수급/뉴스 중심)",
  "conviction": {
    "score": 7,
    "label": "매수 | 강력 매수 | 중립 | 매도 | 강력 매도",
    "factors": [
      {"name": "기술적 분석", "signal": "bullish | bearish | neutral", "weight": 25},
      {"name": "수급", "signal": "bullish | bearish | neutral", "weight": 25},
      {"name": "뉴스 센티먼트", "signal": "bullish | bearish | neutral", "weight": 20},
      {"name": "애널리스트 컨센서스", "signal": "bullish | bearish | neutral", "weight": 30}
    ]
  },
  "actionItem": {
    "action": "매수 고려 | 비중 확대 | 관망 | 비중 축소 | 매도 고려",
    "reason": "핵심 근거 (1문장)",
    "conditions": ["조건1: ...", "조건2: ..."]
  },
  "analystDigest": "최근 애널리스트 리포트 동향 요약 (2-3문장). 없으면 빈 문자열."
}

conviction.score는 1(강력매도)~10(강력매수), 5가 중립입니다.
factors의 weight 합은 100이어야 합니다.
반드시 제공된 데이터에 근거하여 분석하세요. 추측 금지.`
}

/** 주간 시장 브리핑 프롬프트 */
export function buildWeeklySummaryPrompt(
  stocks: readonly WeeklyStockData[],
  market: WeeklyMarketData,
  weekStart: string,
  weekEnd: string
): string {
  const stockSummaries = stocks
    .map((s) => {
      const foreignLabel = s.weekForeignNet > 0 ? "외국인 순매수" : s.weekForeignNet < 0 ? "외국인 순매도" : ""
      return `- ${s.name}: ${s.weekChangePercent >= 0 ? "+" : ""}${s.weekChangePercent.toFixed(2)}% ${foreignLabel}`
    })
    .join("\n")

  const kospi = market.indices.find((i) => i.name === "KOSPI")
  const kosdaq = market.indices.find((i) => i.name === "KOSDAQ")
  const kospiStr = kospi
    ? `KOSPI ${kospi.weekChangePercent >= 0 ? "+" : ""}${kospi.weekChangePercent.toFixed(2)}%`
    : ""
  const kosdaqStr = kosdaq
    ? `KOSDAQ ${kosdaq.weekChangePercent >= 0 ? "+" : ""}${kosdaq.weekChangePercent.toFixed(2)}%`
    : ""

  const fearGreedStr = market.fearGreedStart !== null && market.fearGreedEnd !== null
    ? `공포탐욕지수 ${market.fearGreedStart} → ${market.fearGreedEnd}`
    : ""

  const macroStr = market.macroEvents.length > 0
    ? market.macroEvents.map((e) => `- ${e}`).join("\n")
    : "없음"

  const sectorStr = market.sectorPerformance
    .slice(0, 5)
    .map((s) => `- ${s.sector}: ${s.changePercent >= 0 ? "+" : ""}${s.changePercent.toFixed(2)}%`)
    .join("\n")

  return `아래는 ${weekStart} ~ ${weekEnd} 주간 관심종목 ${stocks.length}개의 분석 데이터입니다.

## 시장 주간 동향
${kospiStr}, ${kosdaqStr}, ${fearGreedStr}

## 주간 매크로 이벤트
${macroStr}

## 섹터 주간 성과
${sectorStr || "없음"}

## 관심종목 주간 등락
${stockSummaries}

한국 주식 시장 투자자를 위한 주간 브리핑을 2-3문장으로 작성하세요.
- 전체 관심종목의 주간 동향 요약
- 가장 주목할 만한 움직임
- 시장 맥락과의 연관성

간결하고 사실에 근거하여 작성하세요. JSON이 아닌 일반 텍스트로 응답하세요.`
}

/** 다음 주 전망 프롬프트 */
export function buildWeeklyOutlookPrompt(
  stocks: readonly WeeklyStockData[],
  market: WeeklyMarketData
): string {
  const stockSummaries = stocks
    .map((s) => {
      const conviction = s.currentConviction
        ? `확신도 ${s.currentConviction.score}/10`
        : ""
      return `- ${s.name}: 주간 ${s.weekChangePercent >= 0 ? "+" : ""}${s.weekChangePercent.toFixed(2)}% ${conviction}`
    })
    .join("\n")

  const kospi = market.indices.find((i) => i.name === "KOSPI")
  const kospiStr = kospi
    ? `KOSPI ${kospi.weekChangePercent >= 0 ? "+" : ""}${kospi.weekChangePercent.toFixed(2)}%`
    : ""

  const macroStr = market.macroEvents.length > 0
    ? market.macroEvents.map((e) => `- ${e}`).join("\n")
    : "없음"

  const sectorStr = market.sectorPerformance
    .slice(0, 5)
    .map((s) => `- ${s.sector}: ${s.changePercent >= 0 ? "+" : ""}${s.changePercent.toFixed(2)}%`)
    .join("\n")

  return `아래는 이번 주 관심종목과 시장 데이터입니다. 다음 주 전망을 분석하세요.

## 시장
${kospiStr}

## 이번 주 매크로 이벤트
${macroStr}

## 섹터 동향
${sectorStr || "없음"}

## 관심종목 이번 주 성과
${stockSummaries}

다음 주 전망을 아래 JSON 형식으로만 응답하세요:
{
  "events": ["다음 주 주요 일정/이벤트 1", "일정 2", "일정 3"],
  "risks": ["주의 사항 1", "주의 사항 2"],
  "strategy": "다음 주 투자 전략 제안 (2-3문장)"
}

반드시 제공된 데이터에 근거하여 분석하세요. 추측 금지.
일정은 한국 시장 기준으로 작성하세요.`
}

/** 주간 핵심 하이라이트 프롬프트 */
export function buildWeeklyHighlightsPrompt(
  stocks: readonly WeeklyStockData[],
  market: WeeklyMarketData
): string {
  const stockSummaries = stocks
    .map((s) => {
      const foreignLabel = s.weekForeignNet > 0
        ? `외국인 ${s.weekForeignNet.toLocaleString("ko-KR")}주 순매수`
        : s.weekForeignNet < 0
          ? `외국인 ${Math.abs(s.weekForeignNet).toLocaleString("ko-KR")}주 순매도`
          : ""
      return `- ${s.name}: ${s.weekChangePercent >= 0 ? "+" : ""}${s.weekChangePercent.toFixed(2)}%, ${foreignLabel}`
    })
    .join("\n")

  const kospi = market.indices.find((i) => i.name === "KOSPI")
  const kospiStr = kospi
    ? `KOSPI ${kospi.weekChangePercent >= 0 ? "+" : ""}${kospi.weekChangePercent.toFixed(2)}%`
    : ""

  const macroStr = market.macroEvents.length > 0
    ? market.macroEvents.map((e) => `- ${e}`).join("\n")
    : "없음"

  const topGainer = [...stocks].sort((a, b) => b.weekChangePercent - a.weekChangePercent)[0]
  const topLoser = [...stocks].sort((a, b) => a.weekChangePercent - b.weekChangePercent)[0]

  const topGainerStr = topGainer
    ? `주간 최고 상승: ${topGainer.name} (${topGainer.weekChangePercent >= 0 ? "+" : ""}${topGainer.weekChangePercent.toFixed(2)}%)`
    : ""
  const topLoserStr = topLoser
    ? `주간 최대 하락: ${topLoser.name} (${topLoser.weekChangePercent >= 0 ? "+" : ""}${topLoser.weekChangePercent.toFixed(2)}%)`
    : ""

  return `아래 주간 데이터에서 핵심 하이라이트 3-5개를 추출하세요.

## 시장
${kospiStr}

## 매크로 이벤트
${macroStr}

## 관심종목 주간 성과
${stockSummaries}

## 주목 데이터
${topGainerStr}
${topLoserStr}

주간 핵심 하이라이트를 3-5개 작성하세요.
각 항목은 구체적 수치를 포함하고, 한 줄로 작성하세요.
반드시 아래 JSON 형식으로만 응답하세요:
["하이라이트 1", "하이라이트 2", "하이라이트 3"]

반드시 제공된 데이터에 근거하여 작성하세요. 추측 금지.`
}
