/**
 * US 보고서 AI 프롬프트 빌더
 */

import type { USStockReportData, USMarketContextData, USRawReportData } from "./us-types"

function formatTechnical(stock: USStockReportData): string {
  const t = stock.technical
  if (!t) return "기술지표: 데이터 없음"

  return [
    `RSI(14): ${t.rsi.toFixed(1)}`,
    `MACD: ${t.macdHistogram > 0 ? "양(+)" : "음(-)"} ${t.macdHistogram.toFixed(3)}`,
    `SMA20 대비: ${t.priceVsSma20 > 0 ? "+" : ""}${t.priceVsSma20.toFixed(1)}%`,
    `SMA200 대비: ${t.priceVsSma200 > 0 ? "+" : ""}${t.priceVsSma200.toFixed(1)}%`,
    `거래량 비율(20일): ${t.volumeRatio.toFixed(2)}x`,
  ].join(", ")
}

function formatHeadlines(stock: USStockReportData): string {
  if (stock.news.length === 0) return "최근 뉴스 없음"
  return stock.news.slice(0, 3).map((n) => n.headline).join("; ")
}

export function buildUSMoveAnalysisPrompt(
  stock: USStockReportData,
  market: USMarketContextData,
  date: string
): string {
  const q = stock.quote
  const m = stock.metrics
  const spy = market.indices.find((i) => i.symbol === "SPY")

  return `당신은 미국 주식 전문 애널리스트입니다. 아래 데이터를 기반으로 이 종목의 주요 등락 요인을 분석하세요.

## 종목 정보
- 종목: ${stock.nameKr} (${stock.symbol})
- 섹터: ${stock.sectorKr || stock.sector}
- 날짜: ${date}

## 시세
- 현재가: $${q?.price.toFixed(2) ?? "N/A"}, 전일대비: ${q?.changePercent != null ? `${q.changePercent > 0 ? "+" : ""}${q.changePercent.toFixed(2)}%` : "N/A"}

## 밸류에이션
- PER: ${m.pe?.toFixed(1) ?? "N/A"}, PBR: ${m.pb?.toFixed(2) ?? "N/A"}, EPS: $${m.eps?.toFixed(2) ?? "N/A"}
- 배당수익률: ${m.dividendYield?.toFixed(2) ?? "N/A"}%, Beta: ${m.beta?.toFixed(2) ?? "N/A"}
- 시가총액: ${m.marketCap ? `$${(m.marketCap / 1000).toFixed(1)}B` : "N/A"}
- 52주 고/저: $${m.fiftyTwoWeekHigh?.toFixed(2) ?? "N/A"} / $${m.fiftyTwoWeekLow?.toFixed(2) ?? "N/A"}

## 기술지표
${formatTechnical(stock)}

## 시장 맥락
- S&P 500: ${spy?.changePercent != null ? `${spy.changePercent > 0 ? "+" : ""}${spy.changePercent.toFixed(2)}%` : "N/A"}
- 공포-탐욕 지수: ${market.fearGreed?.score ?? "N/A"} (${market.fearGreed?.label ?? ""})

## 최근 뉴스
${formatHeadlines(stock)}

## 출력 형식 (JSON만 출력)
{"reasons":[{"rank":1,"category":"valuation|momentum|news|technical|earnings|macro","description":"한글 설명 1문장","impact":"positive|negative","evidence":"근거 데이터"},{"rank":2,...}],"outlook":"향후 1-2주 전망 1-2문장"}
최대 3개 요인을 중요도 순으로, 반드시 JSON만 출력하세요.`
}

export function buildUSExecutiveSummaryPrompt(raw: USRawReportData): string {
  const stockSummaries = raw.stocks
    .map((s) => {
      const q = s.quote
      return `${s.nameKr}(${s.symbol}): ${q ? `$${q.price.toFixed(2)} ${q.changePercent > 0 ? "+" : ""}${q.changePercent.toFixed(2)}%` : "N/A"}`
    })
    .join(", ")

  const spy = raw.market.indices.find((i) => i.symbol === "SPY")
  const qqq = raw.market.indices.find((i) => i.symbol === "QQQ")

  const sectorSummary = raw.market.sectors
    .map(
      (s) =>
        `${s.sectorKr}(${s.etf}): ${s.changePercent > 0 ? "+" : ""}${s.changePercent.toFixed(2)}%`
    )
    .join(", ")

  return `미국 주식 데일리 리포트의 Executive Summary를 작성하세요.

## 시장 현황
- S&P 500: ${spy ? `${spy.price.toFixed(2)} (${spy.changePercent > 0 ? "+" : ""}${spy.changePercent.toFixed(2)}%)` : "N/A"}
- NASDAQ 100: ${qqq ? `${qqq.price.toFixed(2)} (${qqq.changePercent > 0 ? "+" : ""}${qqq.changePercent.toFixed(2)}%)` : "N/A"}
- 공포-탐욕 지수: ${raw.market.fearGreed?.score ?? "N/A"} (${raw.market.fearGreed?.label ?? ""})

## 관심종목 현황
${stockSummaries}

## 섹터 동향
${sectorSummary}

2-3문장으로 오늘 시장의 핵심 포인트와 관심종목 동향을 요약하세요. 한국어로 작성, 간결하게. 마크다운 없이 평문으로 작성.`
}

export function buildUSPortfolioInsightPrompt(raw: USRawReportData): string {
  const stockList = raw.stocks
    .map((s) => {
      const m = s.metrics
      return `${s.nameKr}(${s.symbol}): 섹터=${s.sectorKr || s.sector}, PER=${m.pe?.toFixed(1) ?? "N/A"}, 배당=${m.dividendYield?.toFixed(2) ?? "0"}%, Beta=${m.beta?.toFixed(2) ?? "N/A"}, 시총=${m.marketCap ? `$${(m.marketCap / 1000).toFixed(0)}B` : "N/A"}`
    })
    .join("\n")

  return `아래 미국 관심종목 포트폴리오를 분석하세요.

${stockList}

다음 관점에서 3-4문장으로 인사이트를 제공하세요:
1. 섹터 분산도: 특정 섹터에 편중되었는지
2. 리스크: 고PER/고Beta 종목 비중
3. 배당 수익: 배당주 비중과 평균 배당수익률
4. 개선 제안: 포트폴리오 보완을 위한 방향

한국어로 간결하게, 마크다운 없이 평문으로 작성하세요.`
}

export function buildUSWatchPointsPrompt(raw: USRawReportData): string {
  const signals = raw.stocks
    .map((s) => {
      const t = s.technical
      if (!t) return null
      const alerts: string[] = []
      if (t.rsi > 70) alerts.push(`RSI ${t.rsi.toFixed(0)} 과매수`)
      if (t.rsi < 30) alerts.push(`RSI ${t.rsi.toFixed(0)} 과매도`)
      if (t.macdHistogram > 0 && t.macdLine > 0)
        alerts.push("MACD 골든크로스 진행")
      if (t.macdHistogram < 0 && t.macdLine < 0)
        alerts.push("MACD 데드크로스 진행")
      if (t.priceVsSma200 < -10)
        alerts.push(`SMA200 대비 ${t.priceVsSma200.toFixed(1)}% 하회`)
      if (t.priceVsSma200 > 20)
        alerts.push(`SMA200 대비 ${t.priceVsSma200.toFixed(1)}% 상회`)
      if (alerts.length === 0) return null
      return `${s.nameKr}: ${alerts.join(", ")}`
    })
    .filter(Boolean)

  const headlines = raw.stocks
    .flatMap((s) =>
      s.news.slice(0, 2).map((n) => `[${s.symbol}] ${n.headline}`)
    )
    .slice(0, 5)

  return `아래 기술적 시그널과 뉴스를 바탕으로 주요 관찰 포인트를 3-5개 제시하세요.

## 기술적 시그널
${signals.length > 0 ? signals.join("\n") : "특이 시그널 없음"}

## 시장 심리
공포-탐욕 지수: ${raw.market.fearGreed?.score ?? "N/A"} (${raw.market.fearGreed?.label ?? ""})

## 주요 뉴스
${headlines.length > 0 ? headlines.join("\n") : "특이 뉴스 없음"}

출력 형식 (JSON 배열만):
["관찰 포인트 1","관찰 포인트 2",...]
한국어로, 행동 가능한 구체적 관찰 포인트를 JSON 배열로만 출력하세요.`
}
