/**
 * 컨텍스트 빌더 — 각 데이터 타입을 AI 프롬프트용 텍스트로 변환한다.
 */

import type { ConsensusData } from "@/lib/api/naver-consensus"
import type { InvestorFlow } from "@/lib/api/naver-investor-types"
import type { FinanceData } from "@/lib/api/naver-finance-detail"
import type { DividendInfo } from "@/lib/api/dart-dividend-types"
import type { InsiderActivity } from "@/lib/api/dart-insider-types"
import type { BlockHolding } from "@/lib/api/dart-block-holdings-types"
import type { NewsArticle } from "@/lib/api/news-types"
import type { TechnicalIndicators } from "@/lib/analysis/technical"
import type { RankingResult } from "@/lib/api/naver-ranking"
import type { Theme, ThemeStockResult } from "@/lib/api/naver-theme"
import type { CorporateEvent } from "@/lib/api/dart-events-types"
import type { MacroIndicator } from "@/lib/api/ecos-types"
import type { GlobalMacroIndicator } from "@/lib/api/fred-types"
import type { IpoItem } from "@/lib/api/ipo-38comm"
import type { EarningsSurpriseResult } from "@/lib/analysis/earnings-surprise"
import type { SectorPerformance } from "@/lib/analysis/sector-rotation"
import type { ProgramTradingData } from "@/lib/api/naver-program"
import type { ShortSellingData } from "@/lib/api/naver-short-selling"
import type { FearGreedData } from "@/lib/api/fear-greed"
import type { EnhancedStockData, EnhancedMarketData, USStockChatData, USMarketOverviewData } from "./data-fetcher"

// ── 개별 컨텍스트 빌더 ──────────────────────────────────────────

/** 컨센서스 데이터 → 텍스트 */
export function buildConsensusContext(data: ConsensusData | null): string {
  if (!data) return ""

  const lines: string[] = ["\n[애널리스트 컨센서스]"]
  const { consensus, reports } = data

  if (consensus.targetPrice != null) {
    lines.push(`목표가: ${consensus.targetPrice.toLocaleString()}원`)
  }
  if (consensus.investmentOpinion) {
    lines.push(`투자의견: ${consensus.investmentOpinion}`)
  }
  if (consensus.analystCount > 0) {
    lines.push(`분석 애널리스트 수: ${consensus.analystCount}명`)
  }

  const topReports = reports.slice(0, 3)
  if (topReports.length > 0) {
    lines.push("최근 리포트:")
    for (const r of topReports) {
      const tp = r.targetPrice ? ` (목표가 ${r.targetPrice.toLocaleString()}원)` : ""
      lines.push(`  - [${r.date}] ${r.provider}: ${r.title}${tp}`)
    }
  }

  return lines.join("\n")
}

/** 투자자 동향 데이터 → 텍스트 */
export function buildInvestorFlowContext(data: InvestorFlow | null): string {
  if (!data || data.entries.length === 0) return ""

  const recent = data.entries.slice(0, 5)
  let foreignSum = 0
  let institutionSum = 0

  for (const entry of recent) {
    foreignSum += entry.foreignNet
    institutionSum += entry.institutionNet
  }

  const latestRatio = recent[0]?.foreignRatio ?? 0

  const lines: string[] = ["\n[투자자 동향 (최근 5일)]"]
  lines.push(`외국인 순매수 합산: ${foreignSum.toLocaleString()}주`)
  lines.push(`기관 순매수 합산: ${institutionSum.toLocaleString()}주`)
  if (latestRatio > 0) {
    lines.push(`외국인 보유비율: ${latestRatio.toFixed(2)}%`)
  }

  return lines.join("\n")
}

/** 재무제표 데이터 → 텍스트 */
export function buildFinancialsContext(data: FinanceData | null): string {
  if (!data || data.rows.length === 0) return ""

  const lines: string[] = ["\n[재무제표 (연간)]"]

  const keyMetrics = ["매출액", "영업이익", "당기순이익", "ROE", "부채비율", "영업이익률"]
  const latestCol = data.columns.length > 0 ? data.columns[data.columns.length - 1] : null

  if (latestCol) {
    lines.push(`기준: ${latestCol.title}${latestCol.isConsensus ? " (컨센서스)" : ""}`)
  }

  for (const metric of keyMetrics) {
    const row = data.rows.find((r) => r.title.includes(metric))
    if (row) {
      const latestVal = row.values[row.values.length - 1]
      const prevVal = row.values.length > 1 ? row.values[row.values.length - 2] : null
      const prevStr = prevVal ? ` (전기: ${prevVal})` : ""
      lines.push(`${row.title}: ${latestVal ?? "N/A"}${prevStr}`)
    }
  }

  return lines.join("\n")
}

/** 배당 데이터 → 텍스트 */
export function buildDividendContext(data: DividendInfo | null): string {
  if (!data) return ""

  const lines: string[] = ["\n[배당 정보]"]
  lines.push(`기준연도: ${data.year}년`)
  if (data.dividendPerShare > 0) {
    lines.push(`주당배당금: ${data.dividendPerShare.toLocaleString()}원`)
  }
  if (data.dividendYield > 0) {
    lines.push(`배당수익률: ${data.dividendYield.toFixed(2)}%`)
  }
  if (data.payoutRatio > 0) {
    lines.push(`배당성향: ${data.payoutRatio.toFixed(1)}%`)
  }
  if (data.prevDividendPerShare > 0) {
    lines.push(`전기 주당배당금: ${data.prevDividendPerShare.toLocaleString()}원`)
  }

  return lines.join("\n")
}

/** 내부자 거래 데이터 → 텍스트 */
export function buildInsiderContext(activities: readonly InsiderActivity[]): string {
  if (activities.length === 0) return ""

  const lines: string[] = ["\n[내부자 거래 (최근)]"]
  const recent = activities.slice(0, 5)

  for (const a of recent) {
    const typeStr = a.type === "buy" ? "매수" : a.type === "sell" ? "매도" : "기타"
    lines.push(
      `  - [${a.date}] ${a.name}(${a.position}): ${typeStr} ${a.shares.toLocaleString()}주 (지분 ${a.ratio.toFixed(2)}%, 변동 ${a.ratioChange >= 0 ? "+" : ""}${a.ratioChange.toFixed(2)}%p)`
    )
  }

  return lines.join("\n")
}

/** 대량보유 데이터 → 텍스트 */
export function buildBlockHoldingsContext(holdings: readonly BlockHolding[]): string {
  if (holdings.length === 0) return ""

  const lines: string[] = ["\n[대량보유 변동 (최근)]"]
  const recent = holdings.slice(0, 3)

  for (const h of recent) {
    lines.push(
      `  - [${h.reportDate}] ${h.reporter}: ${h.shares.toLocaleString()}주 (${h.ratio.toFixed(2)}%, 변동 ${h.ratioChange >= 0 ? "+" : ""}${h.ratioChange.toFixed(2)}%p)`
    )
  }

  return lines.join("\n")
}

/** 뉴스 데이터 → 텍스트 */
export function buildNewsContext(articles: readonly NewsArticle[]): string {
  if (articles.length === 0) return ""

  const lines: string[] = ["\n[관련 뉴스]"]
  const top = articles.slice(0, 5)

  for (const a of top) {
    const dateStr = a.publishedAt ? ` (${a.publishedAt})` : ""
    lines.push(`  - ${a.title}${dateStr} - ${a.source}`)
  }

  return lines.join("\n")
}

/** 기술적 분석 데이터 → 텍스트 */
export function buildTechnicalContext(
  indicators: TechnicalIndicators | null,
  score: number | null
): string {
  if (!indicators) return ""

  const lines: string[] = ["\n[기술적 분석]"]

  if (score != null) {
    lines.push(`기술적 점수: ${score}/10`)
  }

  lines.push(`RSI(14): ${indicators.rsi.toFixed(1)}`)

  const macdSignal = indicators.macdHistogram > 0 ? "매수 신호" : "매도 신호"
  lines.push(`MACD: ${indicators.macdLine.toFixed(2)} (시그널: ${indicators.macdSignal.toFixed(2)}, ${macdSignal})`)

  lines.push(`이동평균 대비: 20일 ${indicators.priceVsSma20 >= 0 ? "+" : ""}${indicators.priceVsSma20.toFixed(1)}%, 50일 ${indicators.priceVsSma50 >= 0 ? "+" : ""}${indicators.priceVsSma50.toFixed(1)}%, 200일 ${indicators.priceVsSma200 >= 0 ? "+" : ""}${indicators.priceVsSma200.toFixed(1)}%`)

  lines.push(`볼린저 밴드: 상단 ${indicators.bollingerUpper.toLocaleString()} / 중간 ${indicators.bollingerMiddle.toLocaleString()} / 하단 ${indicators.bollingerLower.toLocaleString()}`)

  lines.push(`거래량 비율(20일 평균 대비): ${indicators.volumeRatio.toFixed(2)}배`)

  return lines.join("\n")
}

/** 랭킹 데이터 → 텍스트 */
export function buildRankingContext(ranking: {
  readonly kospiUp?: RankingResult | null
  readonly kospiDown?: RankingResult | null
  readonly kosdaqUp?: RankingResult | null
  readonly kosdaqDown?: RankingResult | null
}): string {
  const lines: string[] = ["\n[등락률 TOP]"]

  const formatStocks = (label: string, result: RankingResult | null | undefined) => {
    if (!result || result.stocks.length === 0) return
    lines.push(`\n${label}:`)
    const top = result.stocks.slice(0, 5)
    for (const s of top) {
      lines.push(
        `  ${s.rank}. ${s.name}(${s.ticker}): ${s.price.toLocaleString()}원 (${s.changePercent >= 0 ? "+" : ""}${s.changePercent.toFixed(2)}%)`
      )
    }
  }

  formatStocks("코스피 상승 TOP", ranking.kospiUp)
  formatStocks("코스피 하락 TOP", ranking.kospiDown)
  formatStocks("코스닥 상승 TOP", ranking.kosdaqUp)
  formatStocks("코스닥 하락 TOP", ranking.kosdaqDown)

  return lines.join("\n")
}

/** 테마 데이터 → 텍스트 */
export function buildThemesContext(
  themes: readonly Theme[],
  themeStocks?: ReadonlyMap<string, ThemeStockResult>
): string {
  if (themes.length === 0) return ""

  const sorted = [...themes]
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
    .slice(0, 7)

  const lines: string[] = ["\n[인기 테마]"]

  for (const theme of sorted) {
    lines.push(
      `• ${theme.name}: ${theme.changePercent >= 0 ? "+" : ""}${theme.changePercent.toFixed(2)}% (${theme.stockCount}종목)`
    )

    const stocks = themeStocks?.get(theme.no)
    if (stocks && stocks.stocks.length > 0) {
      const top = stocks.stocks.slice(0, 3)
      const names = top.map(
        (s) => `${s.name}(${s.changePercent >= 0 ? "+" : ""}${s.changePercent.toFixed(1)}%)`
      )
      lines.push(`  주요종목: ${names.join(", ")}`)
    }
  }

  return lines.join("\n")
}

/** 매크로 경제 지표 → 텍스트 */
export function buildMacroContext(
  korean: readonly MacroIndicator[],
  global: readonly GlobalMacroIndicator[]
): string {
  const lines: string[] = ["\n[경제 지표]"]

  if (korean.length > 0) {
    lines.push("\n한국:")
    for (const ind of korean) {
      const changeStr = ind.change !== 0
        ? ` (${ind.change >= 0 ? "+" : ""}${ind.changePercent.toFixed(2)}%)`
        : ""
      lines.push(`  ${ind.name}: ${ind.value}${ind.unit}${changeStr} (${ind.date})`)
    }
  }

  if (global.length > 0) {
    lines.push("\n글로벌:")
    for (const ind of global) {
      const changeStr = ind.change !== 0
        ? ` (${ind.change >= 0 ? "+" : ""}${ind.changePercent.toFixed(2)}%)`
        : ""
      lines.push(`  ${ind.nameKr}: ${ind.value}${ind.unit}${changeStr} (${ind.date})`)
    }
  }

  return lines.join("\n")
}

/** 기업 공시 이벤트 → 텍스트 */
export function buildCorporateEventsContext(
  events: readonly CorporateEvent[]
): string {
  if (events.length === 0) return ""

  const lines: string[] = ["\n[최근 기업 공시]"]
  const recent = events.slice(0, 10)

  for (const e of recent) {
    lines.push(
      `  - [${e.date}] ${e.corpName}(${e.stockCode}): ${e.reportName} [${e.category}]`
    )
  }

  return lines.join("\n")
}

/** 실적 서프라이즈 데이터 → 텍스트 */
export function buildEarningsSurpriseContext(data: EarningsSurpriseResult | null): string {
  if (!data || data.surprises.length === 0) return ""

  const lines: string[] = ["\n[실적 서프라이즈]"]

  for (const s of data.surprises) {
    const verdictKr = s.verdict === "beat" ? "상회" : s.verdict === "miss" ? "하회" : "부합"
    lines.push(
      `${s.metric} (${s.quarter}): 실적 ${s.actual.toLocaleString()}억 vs 컨센서스 ${s.consensus.toLocaleString()}억 → ${verdictKr} (${s.surprisePercent >= 0 ? "+" : ""}${s.surprisePercent.toFixed(1)}%)`
    )
  }

  return lines.join("\n")
}

/** IPO 목록 → 텍스트 */
export function buildIpoContext(items: readonly IpoItem[]): string {
  if (items.length === 0) return ""

  const lines: string[] = ["\n[공모주 일정]"]
  const upcoming = items.filter((i) => i.status === "upcoming" || i.status === "active").slice(0, 5)

  for (const item of upcoming) {
    const statusKr = item.status === "active" ? "[청약중]" : item.dDay && item.dDay > 0 ? `[D-${item.dDay}]` : "[예정]"
    lines.push(
      `${statusKr} ${item.company}: 청약일 ${item.subscriptionDate || "미정"} | 공모가 ${item.offeringPrice || item.offeringPriceRange || "미정"} | 주관사 ${item.leadUnderwriter || "미정"}`
    )
  }

  return lines.join("\n")
}

/** 섹터 성과 데이터 → 텍스트 */
export function buildSectorRotationContext(sectors: readonly SectorPerformance[]): string {
  if (sectors.length === 0) return ""

  const lines: string[] = ["\n[섹터 로테이션]"]

  const top5 = sectors.slice(0, 5)
  const bottom5 = [...sectors].sort((a, b) => a.return1m - b.return1m).slice(0, 5)

  lines.push("\n강세 업종 (1개월 기준):")
  for (const s of top5) {
    const momentumKr = s.momentum === "accelerating" ? "가속" : s.momentum === "decelerating" ? "감속" : "안정"
    lines.push(
      `  ${s.sector}: 1주 ${s.return1w >= 0 ? "+" : ""}${s.return1w.toFixed(1)}% | 1월 ${s.return1m >= 0 ? "+" : ""}${s.return1m.toFixed(1)}% | 3월 ${s.return3m >= 0 ? "+" : ""}${s.return3m.toFixed(1)}% (${momentumKr})`
    )
  }

  lines.push("\n약세 업종 (1개월 기준):")
  for (const s of bottom5) {
    lines.push(
      `  ${s.sector}: 1주 ${s.return1w >= 0 ? "+" : ""}${s.return1w.toFixed(1)}% | 1월 ${s.return1m >= 0 ? "+" : ""}${s.return1m.toFixed(1)}%`
    )
  }

  return lines.join("\n")
}

/** 프로그램매매 데이터 → 텍스트 */
export function buildProgramTradingContext(data: ProgramTradingData | null): string {
  if (!data || data.entries.length === 0) return ""

  const recent = data.entries.slice(0, 5)
  let netSum = 0
  for (const entry of recent) {
    netSum += entry.programNet
  }

  const direction = netSum > 0 ? "순매수 ↑" : netSum < 0 ? "순매도 ↓" : "중립 →"
  const lines: string[] = ["\n[프로그램매매 (최근 5일)]"]
  lines.push(`5일 누적 순매수: ${netSum.toLocaleString()}주 (${direction})`)

  for (const entry of recent) {
    const arrow = entry.programNet > 0 ? "+" : ""
    lines.push(
      `  ${entry.date}: 매수 ${entry.programBuy.toLocaleString()} | 매도 ${entry.programSell.toLocaleString()} | 순매수 ${arrow}${entry.programNet.toLocaleString()}`
    )
  }

  return lines.join("\n")
}

/** 공매도 데이터 → 텍스트 */
export function buildShortSellingContext(data: ShortSellingData | null): string {
  if (!data || data.entries.length === 0) return ""

  const recent = data.entries.slice(0, 5)
  const avgRatio = recent.reduce((sum, e) => sum + e.shortRatio, 0) / recent.length
  const latestRatio = recent[0]?.shortRatio ?? 0
  const warning = latestRatio > 5 ? " ⚠️ 공매도 비율 높음" : ""

  const lines: string[] = ["\n[공매도 현황 (최근 5일)]"]
  lines.push(`최근 공매도 비율: ${latestRatio.toFixed(2)}% (5일 평균: ${avgRatio.toFixed(2)}%)${warning}`)

  for (const entry of recent) {
    lines.push(
      `  ${entry.date}: 공매도량 ${entry.shortVolume.toLocaleString()}주 (비율 ${entry.shortRatio.toFixed(2)}%)`
    )
  }

  return lines.join("\n")
}

/** 공포탐욕지수 → 텍스트 */
export function buildFearGreedContext(data: FearGreedData | null): string {
  if (!data) return ""

  const interpretation =
    data.score <= 25 ? "극단적 공포 - 역발상 매수 구간 가능성"
    : data.score <= 40 ? "공포 - 신중한 접근 필요"
    : data.score <= 60 ? "중립 - 방향성 탐색 중"
    : data.score <= 75 ? "탐욕 - 과열 주의"
    : "극단적 탐욕 - 조정 가능성 주의"

  return `\n[공포탐욕지수] ${data.score} (${data.label}) — ${interpretation}`
}

// ── 복합 컨텍스트 빌더 ──────────────────────────────────────────

/** 종목 종합 컨텍스트 — 모든 데이터를 하나의 텍스트로 조합 */
export function buildEnhancedStockContext(
  name: string,
  ticker: string,
  data: EnhancedStockData
): string {
  const sections: string[] = []

  // 기본 시세
  if (data.quote) {
    const q = data.quote
    const basicLines = [
      `\n[종목 데이터: ${name}(${ticker})]`,
      `현재가: ${q.price.toLocaleString()}원 (${q.changePercent >= 0 ? "+" : ""}${q.changePercent.toFixed(2)}%)`,
      `거래량: ${q.volume.toLocaleString()}`,
      `시가총액: ${(q.marketCap / 100000000).toFixed(0)}억원`,
      `52주 최고/최저: ${q.fiftyTwoWeekHigh.toLocaleString()}원 / ${q.fiftyTwoWeekLow.toLocaleString()}원`,
    ]

    if (q.per !== null) basicLines.push(`PER: ${q.per.toFixed(2)}배`)
    if (q.pbr !== null) basicLines.push(`PBR: ${q.pbr.toFixed(2)}배`)
    if (q.eps !== null) basicLines.push(`EPS: ${q.eps.toLocaleString()}원`)
    if (q.dividendYield !== null) basicLines.push(`배당수익률: ${q.dividendYield.toFixed(2)}%`)
    if (q.foreignRate !== null) basicLines.push(`외국인 보유비율: ${q.foreignRate.toFixed(2)}%`)

    sections.push(basicLines.join("\n"))
  }

  // AI 분석
  if (data.aiScore) {
    const ai = data.aiScore
    const aiLines = ["\n[AI 분석]", `종합 점수: ${ai.aiScore}/10`]
    if (ai.rating) aiLines.push(`의견: ${ai.rating}`)
    if (ai.summary) aiLines.push(`요약: ${ai.summary}`)
    if (ai.factors && ai.factors.length > 0) {
      aiLines.push("주요 요인:")
      for (const f of ai.factors) {
        const icon = f.impact === "positive" ? "+" : f.impact === "negative" ? "-" : "•"
        aiLines.push(`  ${icon} ${f.name}`)
      }
    }
    sections.push(aiLines.join("\n"))
  }

  // 나머지 섹션
  sections.push(buildConsensusContext(data.consensus))
  sections.push(buildInvestorFlowContext(data.investorFlow))
  sections.push(buildProgramTradingContext(data.programTrading))
  sections.push(buildShortSellingContext(data.shortSelling))
  sections.push(buildEarningsSurpriseContext(data.earningsSurprise))
  sections.push(buildTechnicalContext(data.technicals, data.technicalScore))
  sections.push(buildFinancialsContext(data.financials))
  sections.push(buildDividendContext(data.dividend))
  sections.push(buildInsiderContext(data.insider))
  sections.push(buildBlockHoldingsContext(data.blockHoldings))
  sections.push(buildNewsContext(data.news))

  return sections.filter(Boolean).join("\n")
}

/** 시장 종합 컨텍스트 — 공포탐욕 + 지수 + 랭킹 + 테마 + 매크로 + 공시 */
export function buildEnhancedMarketContext(data: EnhancedMarketData): string {
  const sections: string[] = []

  // 공포탐욕지수 (맨 앞에 배치)
  sections.push(buildFearGreedContext(data.fearGreed))

  // 시장 지수
  const { indices } = data
  const indexLines = ["\n[시장 현황]"]

  if (indices.kospi) {
    indexLines.push(
      `코스피: ${indices.kospi.price.toLocaleString()} (${indices.kospi.changePercent >= 0 ? "+" : ""}${indices.kospi.changePercent.toFixed(2)}%)`
    )
  }
  if (indices.kosdaq) {
    indexLines.push(
      `코스닥: ${indices.kosdaq.price.toLocaleString()} (${indices.kosdaq.changePercent >= 0 ? "+" : ""}${indices.kosdaq.changePercent.toFixed(2)}%)`
    )
  }
  if (indices.usdKrw) {
    indexLines.push(
      `USD/KRW: ${indices.usdKrw.price.toLocaleString()} (${indices.usdKrw.changePercent >= 0 ? "+" : ""}${indices.usdKrw.changePercent.toFixed(2)}%)`
    )
  }

  sections.push(indexLines.join("\n"))

  // 랭킹 (상승·하락 TOP 5)
  sections.push(
    buildRankingContext({
      kospiUp: data.rankingUp,
      kospiDown: data.rankingDown,
    })
  )

  // 테마
  sections.push(buildThemesContext(data.themes))

  // 매크로
  if (data.koreanMacro.length > 0 || data.globalMacro.length > 0) {
    sections.push(buildMacroContext(data.koreanMacro, data.globalMacro))
  }

  // 공시
  sections.push(buildCorporateEventsContext(data.events))

  return sections.filter(Boolean).join("\n")
}

// ── US Stock Context Builder ─────────────────────────────────

/** 미국 종목 데이터 → AI 프롬프트 텍스트 */
/** 미국 시장 오버뷰 → 텍스트 */
export function buildUSMarketOverviewContext(data: USMarketOverviewData): string {
  const sections: string[] = ["\n[미국 시장 현황]"]

  // 공포탐욕지수
  sections.push(buildFearGreedContext(data.fearGreed))

  // 주요 지수
  if (data.indices.length > 0) {
    sections.push("\n[주요 지수]")
    for (const idx of data.indices) {
      if (idx.price > 0) {
        sections.push(
          `• ${idx.name}(${idx.symbol}): $${idx.price.toFixed(2)} (${idx.changePercent >= 0 ? "+" : ""}${idx.changePercent.toFixed(2)}%)`
        )
      }
    }
  }

  // 시총 상위 종목
  if (data.topStocks.length > 0) {
    sections.push("\n[시가총액 상위 종목]")
    for (const stock of data.topStocks) {
      sections.push(
        `• ${stock.nameKr}(${stock.symbol}): $${stock.price.toFixed(2)} (${stock.changePercent >= 0 ? "+" : ""}${stock.changePercent.toFixed(2)}%)`
      )
    }
  }

  // 실적 캘린더
  if (data.earnings.length > 0) {
    sections.push("\n[향후 실적 발표 일정]")
    for (const e of data.earnings.slice(0, 5)) {
      const epsStr = e.epsEstimate != null ? ` (EPS 추정: $${e.epsEstimate.toFixed(2)})` : ""
      sections.push(`• ${e.date} — ${e.symbol}${epsStr}`)
    }
  }

  return sections.join("\n")
}

export function buildUSStockContext(data: USStockChatData): string {
  const sections: string[] = []

  const displayName = data.nameKr ? `${data.nameKr}(${data.symbol})` : data.symbol

  // 기본 시세
  const q = data.quote
  sections.push(
    `\n[미국 종목: ${displayName} — ${data.name}]`,
    `현재가: $${q.price.toFixed(2)} (${q.changePercent >= 0 ? "+" : ""}${q.changePercent.toFixed(2)}%)`,
    `시가: $${q.open.toFixed(2)} | 고가: $${q.high.toFixed(2)} | 저가: $${q.low.toFixed(2)} | 전일종가: $${q.previousClose.toFixed(2)}`
  )

  // 핵심 지표
  const m = data.metrics
  const metricsLines: string[] = []
  if (m.marketCap) {
    const capStr = m.marketCap >= 1e12
      ? `$${(m.marketCap / 1e12).toFixed(2)}T`
      : `$${(m.marketCap / 1e9).toFixed(1)}B`
    metricsLines.push(`시가총액: ${capStr}`)
  }
  if (m.pe) metricsLines.push(`PER: ${m.pe.toFixed(1)}x`)
  if (m.pb) metricsLines.push(`PBR: ${m.pb.toFixed(1)}x`)
  if (m.eps) metricsLines.push(`EPS: $${m.eps.toFixed(2)}`)
  if (m.dividendYield) metricsLines.push(`배당수익률: ${m.dividendYield.toFixed(2)}%`)
  if (m.beta) metricsLines.push(`베타: ${m.beta.toFixed(2)}`)
  if (m.fiftyTwoWeekHigh) metricsLines.push(`52주최고: $${m.fiftyTwoWeekHigh.toFixed(2)}`)
  if (m.fiftyTwoWeekLow) metricsLines.push(`52주최저: $${m.fiftyTwoWeekLow.toFixed(2)}`)
  if (m.roe) metricsLines.push(`ROE: ${(m.roe * 100).toFixed(1)}%`)

  if (metricsLines.length > 0) {
    sections.push("\n[핵심 지표]", ...metricsLines)
  }

  // 기업 프로필
  sections.push(buildUSProfileContext(data.profile))

  // 밸류에이션·성장성
  sections.push(buildUSStatisticsContext(data.statistics))

  // 기술적 분석
  sections.push(buildUSTechnicalContext(data.technicals, data.technicalScore))

  // 내부자 거래
  sections.push(buildUSInsiderContext(data.insiderTransactions))

  // 배당 이력
  sections.push(buildUSDividendHistoryContext(data.dividendHistory))

  // 실적
  if (data.earnings.length > 0) {
    sections.push("\n[최근 실적]")
    for (const e of data.earnings) {
      const parts: string[] = [e.date]
      if (e.epsActual != null) parts.push(`EPS실제: $${e.epsActual.toFixed(2)}`)
      if (e.epsEstimate != null) parts.push(`추정: $${e.epsEstimate.toFixed(2)}`)
      if (e.surprisePercent != null) {
        const label = e.surprisePercent > 0 ? "Beat" : e.surprisePercent < 0 ? "Miss" : "Inline"
        parts.push(`${label} ${e.surprisePercent > 0 ? "+" : ""}${e.surprisePercent.toFixed(1)}%`)
      }
      sections.push(`• ${parts.join(" | ")}`)
    }
  }

  // 뉴스
  if (data.news.length > 0) {
    sections.push("\n[관련 뉴스]")
    for (const n of data.news) {
      sections.push(`• [${n.source}] ${n.headline}`)
    }
  }

  return sections.filter(Boolean).join("\n")
}

// ── US 상세 컨텍스트 빌더 ───────────────────────────────────

/** US 통계(밸류에이션·성장성·수익성) → 텍스트 */
export function buildUSStatisticsContext(
  stats: USStockChatData["statistics"]
): string {
  if (!stats) return ""

  const lines: string[] = ["\n[밸류에이션·성장성]"]

  if (stats.forwardPE != null) lines.push(`Forward PE: ${stats.forwardPE.toFixed(1)}x`)
  if (stats.pegRatio != null) lines.push(`PEG Ratio: ${stats.pegRatio.toFixed(2)}`)
  if (stats.priceToSales != null) lines.push(`P/S (TTM): ${stats.priceToSales.toFixed(1)}x`)
  if (stats.operatingMargin != null) lines.push(`영업이익률: ${(stats.operatingMargin * 100).toFixed(1)}%`)
  if (stats.profitMargin != null) lines.push(`순이익률: ${(stats.profitMargin * 100).toFixed(1)}%`)
  if (stats.revenueGrowthYoY != null) lines.push(`매출 성장률 YoY: ${(stats.revenueGrowthYoY * 100).toFixed(1)}%`)
  if (stats.earningsGrowthYoY != null) lines.push(`이익 성장률 YoY: ${(stats.earningsGrowthYoY * 100).toFixed(1)}%`)
  if (stats.shortRatio != null) lines.push(`공매도 비율 (Short Ratio): ${stats.shortRatio.toFixed(1)}`)

  return lines.length > 1 ? lines.join("\n") : ""
}

/** US 기업 프로필 → 텍스트 */
export function buildUSProfileContext(
  profile: USStockChatData["profile"]
): string {
  if (!profile) return ""

  const lines: string[] = ["\n[기업 프로필]"]
  if (profile.description) lines.push(`소개: ${profile.description}`)
  if (profile.sector) lines.push(`섹터: ${profile.sector}`)
  if (profile.industry) lines.push(`산업: ${profile.industry}`)
  if (profile.ceo) lines.push(`CEO: ${profile.ceo}`)
  if (profile.employees) lines.push(`직원수: ${Number(profile.employees).toLocaleString()}명`)
  if (profile.ipoDate) lines.push(`IPO: ${profile.ipoDate}`)

  return lines.length > 1 ? lines.join("\n") : ""
}

/** US 배당 이력 → 텍스트 */
export function buildUSDividendHistoryContext(
  dividends: USStockChatData["dividendHistory"]
): string {
  if (!dividends || dividends.length === 0) return ""

  const lines: string[] = ["\n[배당 이력]"]

  for (const d of dividends.slice(0, 8)) {
    lines.push(`  ${d.exDate}: $${d.amount.toFixed(4)}`)
  }

  // 배당 증가/감소 추세
  if (dividends.length >= 2) {
    const latest = dividends[0].amount
    const oldest = dividends[dividends.length - 1].amount
    if (oldest > 0) {
      const growthRate = ((latest / oldest) - 1) * 100
      const trend = growthRate > 0 ? "↑ 증가" : growthRate < 0 ? "↓ 감소" : "→ 유지"
      lines.push(`배당 추세: ${trend} (${growthRate >= 0 ? "+" : ""}${growthRate.toFixed(1)}%)`)
    }
  }

  return lines.join("\n")
}

/** US 내부자 거래 → 텍스트 */
export function buildUSInsiderContext(
  transactions: USStockChatData["insiderTransactions"]
): string {
  if (!transactions || transactions.length === 0) return ""

  const lines: string[] = ["\n[내부자 거래 (최근)]"]

  let buyCount = 0
  let sellCount = 0

  for (const tx of transactions) {
    const typeStr = tx.transactionCode === "P" ? "매수" : tx.transactionCode === "S" ? "매도" : tx.transactionCode
    if (tx.transactionCode === "P") buyCount++
    if (tx.transactionCode === "S") sellCount++

    const priceStr = tx.transactionPrice > 0 ? ` @$${tx.transactionPrice.toFixed(2)}` : ""
    lines.push(
      `  ${tx.transactionDate} | ${tx.name}: ${typeStr} ${Math.abs(tx.change).toLocaleString()}주${priceStr}`
    )
  }

  const sentiment = buyCount > sellCount ? "순매수 (긍정)"
    : sellCount > buyCount ? "순매도 (주의)"
    : "중립"
  lines.push(`내부자 심리: ${sentiment}`)

  return lines.join("\n")
}

/** US 기술적 분석 → 텍스트 (KR buildTechnicalContext 패턴 재활용) */
export function buildUSTechnicalContext(
  indicators: TechnicalIndicators | null,
  score: number | null
): string {
  if (!indicators) return ""

  const lines: string[] = ["\n[기술적 분석]"]

  if (score != null) {
    lines.push(`기술적 점수: ${score}/10`)
  }

  lines.push(`RSI(14): ${indicators.rsi.toFixed(1)}`)

  const macdSignal = indicators.macdHistogram > 0 ? "매수 신호" : "매도 신호"
  lines.push(`MACD: ${indicators.macdLine.toFixed(2)} (시그널: ${indicators.macdSignal.toFixed(2)}, ${macdSignal})`)

  lines.push(`이동평균 대비: 20일 ${indicators.priceVsSma20 >= 0 ? "+" : ""}${indicators.priceVsSma20.toFixed(1)}%, 50일 ${indicators.priceVsSma50 >= 0 ? "+" : ""}${indicators.priceVsSma50.toFixed(1)}%, 200일 ${indicators.priceVsSma200 >= 0 ? "+" : ""}${indicators.priceVsSma200.toFixed(1)}%`)

  lines.push(`볼린저 밴드: 상단 $${indicators.bollingerUpper.toFixed(2)} / 중간 $${indicators.bollingerMiddle.toFixed(2)} / 하단 $${indicators.bollingerLower.toFixed(2)}`)

  lines.push(`거래량 비율(20일 평균 대비): ${indicators.volumeRatio.toFixed(2)}배`)

  return lines.join("\n")
}

// ── US Extended Context Builders ────────────────────────────

/** US 랭킹 → 텍스트 */
export function buildUSRankingContext(data: import("./data-fetcher").USRankingChatData): string {
  if (data.stocks.length === 0) return ""
  const lines = ["\n[미국 주식 등락률 랭킹]"]
  for (const s of data.stocks) {
    lines.push(
      `${s.rank}. ${s.nameKr}(${s.symbol}): $${s.price.toFixed(2)} (${s.changePercent >= 0 ? "+" : ""}${s.changePercent.toFixed(2)}%) [${s.sector}]`
    )
  }
  return lines.join("\n")
}

/** US 테마 → 텍스트 */
export function buildUSThemesContext(data: import("./data-fetcher").USThemeChatData): string {
  if (data.themes.length === 0) return ""
  const lines = ["\n[미국 주요 투자 테마]"]
  for (const t of data.themes) {
    lines.push(
      `• ${t.nameKr} (${t.stockCount}종목): 평균 ${t.avgChange >= 0 ? "+" : ""}${t.avgChange.toFixed(2)}%`
    )
  }
  return lines.join("\n")
}

/** US 섹터 → 텍스트 */
export function buildUSSectorContext(data: import("./data-fetcher").USSectorChatData): string {
  if (data.sectors.length === 0) return ""
  const lines = ["\n[미국 섹터 로테이션 (SPDR ETF)]"]
  for (const s of data.sectors) {
    const m1 = s.return1M != null ? `1M: ${s.return1M >= 0 ? "+" : ""}${s.return1M.toFixed(1)}%` : ""
    const m3 = s.return3M != null ? `3M: ${s.return3M >= 0 ? "+" : ""}${s.return3M.toFixed(1)}%` : ""
    lines.push(`• ${s.nameKr}(${s.symbol}): ${[m1, m3].filter(Boolean).join(" | ")}`)
  }
  return lines.join("\n")
}

/** US IPO → 텍스트 */
export function buildUSIPOContext(data: import("./data-fetcher").USIPOChatData): string {
  const lines: string[] = []
  if (data.upcoming.length > 0) {
    lines.push("\n[미국 IPO 예정]")
    for (const e of data.upcoming.slice(0, 5)) {
      lines.push(`• ${e.date} — ${e.name} (${e.symbol || "TBD"})`)
    }
  }
  if (data.recent.length > 0) {
    lines.push("\n[최근 미국 상장]")
    for (const e of data.recent.slice(0, 5)) {
      lines.push(`• ${e.date} — ${e.name} (${e.symbol})`)
    }
  }
  return lines.join("\n")
}
