/**
 * 오케스트레이터 — 사용자 질문 의도 분류 + 데이터 수집 + 프롬프트 조합
 *
 * 흐름: 질문 → 컴플라이언스 체크 → 의도 분류 → 데이터 수집 → 프롬프트 빌드
 */

import { checkCompliance } from "./compliance"
import {
  resolveStock,
  fetchMultipleStockData,
  fetchMarketOverview,
  resolveTickerNames,
  fetchComprehensiveStockData,
  fetchEnhancedMarketOverview,
  fetchRankingData,
  fetchMacroData,
  fetchThemeData,
  fetchCorporateEventsData,
  fetchMultipleConsensus,
  fetchIpoData,
  fetchSectorData,
  resolveUSStock,
  fetchUSStockData,
  fetchUSMarketOverview,
  fetchUSRankingData,
  fetchUSThemeData,
  fetchUSSectorData,
  fetchUSIPOData,
} from "./data-fetcher"
import { SYSTEM_PROMPT, buildMarketOverviewContext } from "./prompts"
import { getIntentPrompt } from "./prompt-registry"
import { runAnalysisPipeline, runUSAnalysisPipeline } from "./analysis-pipeline"
import {
  buildEnhancedStockContext,
  buildEnhancedMarketContext,
  buildRankingContext,
  buildMacroContext,
  buildThemesContext,
  buildCorporateEventsContext,
  buildIpoContext,
  buildSectorRotationContext,
  buildUSStockContext,
  buildUSMarketOverviewContext,
  buildUSRankingContext,
  buildUSThemesContext,
  buildUSSectorContext,
  buildUSIPOContext,
} from "./context-builders"
import type { PortfolioItem } from "@/store/portfolio"
import {
  assemblePortfolioContext,
  buildPortfolioAnalysisContext,
} from "./intents/portfolio-analysis"
import { buildStockComparisonContext } from "./intents/stock-comparison"
import type { ReportSummaryPayload } from "./intents/report-summary"
import { buildReportSummaryContext } from "./intents/report-summary"
import { buildScenarioAnalysisContext } from "./intents/scenario-analysis"
import { extractMentionedTickers, buildTickerContextHint } from "./context-tracker"

// ── Intent types ──────────────────────────────────────────────

export type Intent =
  | "stock_analysis"
  | "us_stock_analysis"
  | "market_overview"
  | "watchlist_review"
  | "stock_comparison"
  | "portfolio_analysis"
  | "report_summary"
  | "scenario_analysis"
  | "education"
  | "greeting"
  | "general"
  | "macro_economy"
  | "ranking"
  | "theme_analysis"
  | "corporate_events"
  | "ipo"
  | "sector_rotation"

interface OrchestratorResult {
  readonly blocked: boolean
  readonly systemPrompt: string
  readonly contextData: string
  readonly intent: Intent
  /** 컴플라이언스 차단 시 리다이렉트 메시지 */
  readonly redirectMessage?: string
}

// ── Intent classification ─────────────────────────────────────

const INTENT_PATTERNS: readonly {
  readonly intent: Intent
  readonly patterns: readonly RegExp[]
}[] = [
  {
    intent: "portfolio_analysis",
    patterns: [
      /내\s*포트폴리오\s*(?:분석|현황|어때|리뷰|점검)/,
      /내\s*수익률\s*(?:어때|보여줘|알려줘)/,
      /내\s*종목\s*전체\s*(?:분석|현황|어때)/,
      /포트폴리오\s*(?:손익|평가|성과)/,
      /내가\s*가진\s*(?:주식|종목)/,
    ],
  },
  {
    intent: "report_summary",
    patterns: [
      /(?:오늘|최근|마지막|가장\s*최근)\s*(?:데일리|보고서|리포트)\s*(?:요약|알려줘|보여줘|내용)/,
      /데일리\s*보고서\s*(?:요약|내용|결과)/,
      /보고서\s*(?:요약|내용|결과|확인)/,
      /리포트\s*(?:요약|알려줘|확인)/,
    ],
  },
  {
    intent: "scenario_analysis",
    patterns: [
      /금리(?:가|이)\s*(?:오르면|인상되면|올라가면)/,
      /금리(?:가|이)\s*(?:내리면|인하되면|내려가면)/,
      /원화(?:가|이)\s*(?:약세|강세)(?:면|이면|라면)/,
      /달러(?:가|이)\s*(?:오르면|내리면|강세면|약세면)/,
      /경기\s*(?:침체|불황)(?:이|가)\s*오면/,
      /(?:인플레이션|물가)\s*(?:상승|급등)(?:하면|이면)/,
      /시나리오\s*(?:분석|상|하에서)/,
      /(?:만약|가정|가령)\s*.*(?:면|다면|이라면)/,
    ],
  },
  {
    intent: "market_overview",
    patterns: [
      /시장\s*(?:현황|상황|어때|어떤|어떻게|요약|동향|정리)/,
      /코스피|코스닥|나스닥/,
      /오늘\s*(?:주식|증시|장|시장)/,
      /장\s*(?:마감|시작|어때)/,
    ],
  },
  {
    intent: "watchlist_review",
    patterns: [
      /관심\s*종목\s*(?:리뷰|분석|현황|어때|전체|요약|정리)/,
      /내\s*종목/,
      /(?:전체|모든|다)\s*종목\s*(?:리뷰|분석|어때)/,
    ],
  },
  {
    intent: "stock_comparison",
    patterns: [
      /vs|비교|대비|(?:이랑|하고|랑)\s*비교/,
    ],
  },
  {
    intent: "macro_economy",
    patterns: [
      /(?:매크로|거시\s*경제|경제\s*지표|기준\s*금리|금리|CPI|소비자\s*물가)/,
      /(?:연준|한은|한국은행|FOMC|통화\s*정책)/,
      /(?:유가|금값|금\s*가격|원유|달러\s*인덱스|달러\s*지수)/,
      /(?:국채|채권\s*금리|국고채)/,
    ],
  },
  {
    intent: "ranking",
    patterns: [
      /(?:상승률|하락률|등락률)\s*(?:TOP|탑|순위|상위)/i,
      /(?:급등|급락|상한가|하한가)\s*종목/,
      /(?:TOP|탑)\s*(?:종목|주식)/i,
      /(?:오늘|금일)\s*(?:상승|하락|급등|급락)/,
    ],
  },
  {
    intent: "theme_analysis",
    patterns: [
      /(?:테마|섹터|업종)\s*(?:트렌드|분석|인기|현황|추세|동향)/,
      /인기\s*(?:테마|섹터|업종)/,
      /(?:요즘|최근)\s*(?:인기|핫한|뜨는)\s*(?:테마|섹터|업종)/,
    ],
  },
  {
    intent: "corporate_events",
    patterns: [
      /(?:공시|기업\s*공시|주요\s*공시)/,
      /(?:유상증자|무상증자|자사주|전환사채|CB|BW|신주인수권)/,
      /(?:합병|분할|인수합병|M&A)/i,
    ],
  },
  {
    intent: "ipo",
    patterns: [
      /공모주\s*(?:일정|캘린더|청약|현황|정보)/,
      /(?:IPO|ipo)\s*(?:일정|캘린더|현황)/i,
      /(?:이번\s*주|다음\s*주|이번\s*달)\s*(?:공모주|청약)/,
    ],
  },
  {
    intent: "sector_rotation",
    patterns: [
      /(?:섹터|업종)\s*(?:로테이션|성과|수익률|강세|약세|히트맵)/,
      /(?:강세|약세)\s*(?:섹터|업종)/,
      /(?:최근|요즘)\s*(?:강세|약세)\s*(?:섹터|업종)/,
    ],
  },
  {
    intent: "us_stock_analysis",
    patterns: [
      /(?:AAPL|MSFT|NVDA|GOOG|GOOGL|AMZN|META|TSLA|BRK|JPM|V|MA|JNJ|UNH|WMT|PG|HD|AVGO|ORCL|CRM|AMD|ADBE|NFLX|COST|PEP|KO|MCD|INTC|CSCO|QCOM|IBM)\b/,
      /(?:애플|마이크로소프트|엔비디아|구글|알파벳|아마존|메타|페이스북|테슬라|넷플릭스|디즈니|코카콜라|스타벅스|나이키|보잉|인텔|팔란티어|AMD)/,
      /(?:미국|미주|해외)\s*(?:주식|종목|시장|주가)/,
      /(?:S&P|나스닥|다우|NASDAQ|NYSE|월스트리트)\s*(?:지수|현황|어때)?/i,
      /(?:실적|어닝|earnings)\s*(?:캘린더|일정|발표)/i,
    ],
  },
  {
    intent: "education",
    patterns: [
      /(?:뭐야|뭔가요|무엇|설명|알려줘|이해|개념)\s*(?:\?|$)/,
      /^(?:PER|PBR|EPS|ROE|ROA|배당|시가총액|거래량|RSI|MACD|볼린저|이동평균|공매도|대차|유상증자|무상증자|CB|BW|전환사채|신주인수권)\s*(?:이|가|은|는|란|뭐|무엇|설명|알려)/i,
    ],
  },
  {
    intent: "greeting",
    patterns: [
      /^(?:안녕|하이|헬로|반가워|반갑|hi|hello)/i,
    ],
  },
]

function classifyIntent(message: string): Intent {
  const normalized = message.replace(/\s+/g, " ").trim()

  for (const { intent, patterns } of INTENT_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(normalized)) return intent
    }
  }

  // 종목명/티커가 포함되면 stock_analysis
  // 이 판단은 resolveStock에서 실제로 확인
  return "general"
}

// ── Ticker extraction ─────────────────────────────────────────

function extractPotentialTickers(message: string): readonly string[] {
  const sixDigit = message.match(/\d{6}/g) ?? []
  return sixDigit
}

function extractStockNames(message: string): readonly string[] {
  // 따옴표나 괄호 안의 종목명
  const quoted = message.match(/['""]([^'""]+)['""]|「([^」]+)」/g) ?? []
  const cleaned = quoted.map((q) => q.replace(/['"'""「」]/g, ""))

  // 일반적인 한국 종목명 패턴 (2~10글자 한글)
  // "삼성전자", "SK하이닉스" 등
  return cleaned
}

/** 비교 질문에서 두 종목을 추출 */
async function resolveMultipleStocks(
  message: string
): Promise<readonly { readonly ticker: string; readonly name: string }[]> {
  // vs, 비교, 이랑, 하고, 랑 등으로 분리
  const parts = message.split(/\s*(?:vs|VS|비교|대비|이랑|하고|랑|와|과)\s*/)

  const resolved: { readonly ticker: string; readonly name: string }[] = []

  for (const part of parts) {
    const trimmed = part.replace(/[?？!！.。,，\s]+/g, " ").trim()
    if (trimmed.length < 2) continue

    // 각 파트에서 종목 추출 시도
    const words = trimmed.split(" ").filter((w) => w.length >= 2 && w.length <= 10)
    for (const word of words) {
      const stock = await resolveStock(word)
      if (stock) {
        resolved.push({ ticker: stock.ticker, name: stock.name })
        break
      }
    }
  }

  return resolved
}

// ── Main orchestrator ─────────────────────────────────────────

export async function orchestrate(
  userMessage: string,
  watchlistTickers: readonly string[] = [],
  marketMode: "kr" | "us" = "kr",
  portfolioItems: readonly PortfolioItem[] = [],
  latestReportSummary: ReportSummaryPayload | null = null
): Promise<OrchestratorResult> {
  // 1. 컴플라이언스 체크
  const compliance = checkCompliance(userMessage)
  if (compliance.blocked) {
    return {
      blocked: true,
      systemPrompt: SYSTEM_PROMPT,
      contextData: "",
      intent: "general",
      redirectMessage: compliance.redirect,
    }
  }

  // 2. 의도 분류
  let intent = classifyIntent(userMessage)

  // 해외 모드일 때: 국내 전용 intent를 US 대응으로 분기
  if (marketMode === "us") {
    // corporate_events만 US 데이터 소스 없음 → us_stock_analysis로 리다이렉트
    if (intent === "corporate_events") {
      intent = "us_stock_analysis"
    }
    // ranking, theme_analysis, ipo, sector_rotation은 US 전용 핸들러 사용 (switch에서 분기)
    // 시장 현황, 인사도 미국 기준으로
    if (intent === "market_overview" || intent === "greeting") {
      intent = "market_overview" // 아래 switch에서 US 분기
    }
    // general이나 stock_analysis도 US로
    if (intent === "general" || intent === "stock_analysis") {
      intent = "us_stock_analysis"
    }
  }

  // 3. 데이터 수집 (의도에 따라)
  let contextData = ""

  switch (intent) {
    case "us_stock_analysis": {
      // 메시지에서 미국 종목 추출 시도
      const usSymbolMatch = userMessage.match(/\b([A-Z]{1,5})\b/)
      const usWords = userMessage
        .replace(/[?？!！.。,，\s]+/g, " ")
        .trim()
        .split(" ")
        .filter((w) => w.length >= 2)

      let usResolved = null as Awaited<ReturnType<typeof resolveUSStock>> | null

      // 대문자 심볼로 먼저 시도
      if (usSymbolMatch) {
        usResolved = await resolveUSStock(usSymbolMatch[1])
      }

      // 한글명으로 시도
      if (!usResolved) {
        for (const word of usWords) {
          usResolved = await resolveUSStock(word)
          if (usResolved) break
        }
      }

      if (usResolved) {
        const usData = await fetchUSStockData(usResolved.symbol)
        if (usData) {
          const rawContext = buildUSStockContext(usData)
          const analysis = runUSAnalysisPipeline(usData)
          contextData = analysis ? `${analysis}\n\n${rawContext}` : rawContext
        }
      } else {
        // 종목 특정 불가 — 미국 시장 오버뷰 제공
        const usMarket = await fetchUSMarketOverview()
        contextData = buildUSMarketOverviewContext(usMarket)
      }
      break
    }

    case "market_overview": {
      if (marketMode === "us") {
        const usMarket = await fetchUSMarketOverview()
        contextData = buildUSMarketOverviewContext(usMarket)
      } else {
        const marketData = await fetchEnhancedMarketOverview()
        contextData = buildEnhancedMarketContext(marketData)
      }
      break
    }

    case "watchlist_review": {
      if (watchlistTickers.length === 0) {
        contextData = "\n[관심종목이 등록되어 있지 않습니다. 먼저 관심종목을 추가해주세요.]"
        break
      }
      const [stocksMap, nameMap, consensusMap] = await Promise.all([
        fetchMultipleStockData(watchlistTickers),
        resolveTickerNames(watchlistTickers),
        fetchMultipleConsensus(watchlistTickers),
      ])
      const watchlistStocks = watchlistTickers
        .map((ticker) => {
          const data = stocksMap.get(ticker)
          const consensus = consensusMap.get(ticker)
          return {
            name: nameMap.get(ticker) ?? ticker,
            ticker,
            price: data?.quote?.price ?? 0,
            changePercent: data?.quote?.changePercent ?? 0,
            aiScore: data?.aiScore?.aiScore ?? null,
            targetPrice: consensus?.consensus.targetPrice ?? null,
            investmentOpinion: consensus?.consensus.investmentOpinion ?? null,
          }
        })
        .filter((s) => s.price > 0)

      const lines = ["\n[관심종목 현황]"]
      for (const s of watchlistStocks) {
        const scoreStr = s.aiScore != null ? ` | AI점수: ${s.aiScore}` : ""
        const targetStr = s.targetPrice
          ? ` | 목표가: ${s.targetPrice.toLocaleString()}원`
          : ""
        const opinionStr = s.investmentOpinion
          ? ` (${s.investmentOpinion})`
          : ""
        lines.push(
          `• ${s.name}(${s.ticker}): ${s.price.toLocaleString()}원 (${s.changePercent >= 0 ? "+" : ""}${s.changePercent.toFixed(2)}%)${scoreStr}${targetStr}${opinionStr}`
        )
      }
      contextData = lines.join("\n")
      break
    }

    case "stock_comparison": {
      try {
        const stocks = await resolveMultipleStocks(userMessage)
        if (stocks.length >= 2) {
          const [dataA, dataB] = await Promise.all([
            fetchComprehensiveStockData(stocks[0].ticker, stocks[0].name),
            fetchComprehensiveStockData(stocks[1].ticker, stocks[1].name),
          ])
          contextData = buildStockComparisonContext(
            stocks[0],
            stocks[1],
            dataA,
            dataB
          )
        } else if (stocks.length === 1) {
          const data = await fetchComprehensiveStockData(stocks[0].ticker, stocks[0].name)
          contextData = buildEnhancedStockContext(stocks[0].name, stocks[0].ticker, data)
        }
      } catch {
        contextData = "\n[종목 비교 데이터 조회 중 오류가 발생했습니다.]"
      }
      break
    }

    case "portfolio_analysis": {
      try {
        if (portfolioItems.length === 0) {
          contextData = "\n[포트폴리오가 비어 있습니다. 포트폴리오에 종목을 추가해주세요.]"
          break
        }
        const krItems = portfolioItems.filter((i) => i.market === "KR")
        const usItems = portfolioItems.filter((i) => i.market === "US")
        const allTickers = krItems.map((i) => i.ticker)

        const [stocksMap, consensusMap] = await Promise.all([
          allTickers.length > 0
            ? fetchMultipleStockData(allTickers)
            : Promise.resolve(new Map<string, import("./data-fetcher").StockData>()),
          allTickers.length > 0
            ? fetchMultipleConsensus(allTickers)
            : Promise.resolve(new Map<string, null>()),
        ])

        // US 종목 가격 조회
        let usQuotes = new Map<string, { readonly price: number; readonly changePercent: number }>()
        if (usItems.length > 0) {
          try {
            const { getUSQuoteBatch } = await import("@/lib/api/finnhub")
            const usSymbols = usItems.map((i) => i.ticker)
            const batchResult = await getUSQuoteBatch(usSymbols)
            usQuotes = new Map(
              usItems.map((i) => {
                const q = batchResult.get(i.ticker)
                return [i.ticker, { price: q?.c ?? 0, changePercent: q?.dp ?? 0 }] as const
              })
            )
          } catch {
            // US 조회 실패 시 빈 맵 유지
          }
        }

        // 가격 맵 구성
        const priceMap = new Map<string, { readonly price: number; readonly changePercent: number }>()
        for (const item of krItems) {
          const data = stocksMap.get(item.ticker)
          priceMap.set(item.ticker, {
            price: data?.quote?.price ?? 0,
            changePercent: data?.quote?.changePercent ?? 0,
          })
        }
        for (const [ticker, quote] of usQuotes) {
          priceMap.set(ticker, quote)
        }

        // AI 점수 맵 구성
        const aiScoreMap = new Map<string, number | null>()
        for (const item of krItems) {
          const data = stocksMap.get(item.ticker)
          aiScoreMap.set(item.ticker, data?.aiScore?.aiScore ?? null)
        }

        const portfolioCtx = assemblePortfolioContext(portfolioItems, priceMap, aiScoreMap)
        contextData = buildPortfolioAnalysisContext(portfolioCtx)
      } catch {
        contextData = "\n[포트폴리오 데이터 조회 중 오류가 발생했습니다.]"
      }
      break
    }

    case "report_summary": {
      try {
        if (!latestReportSummary) {
          contextData = "\n[저장된 보고서가 없습니다. 먼저 데일리 보고서를 생성해주세요.]"
          break
        }
        contextData = buildReportSummaryContext(latestReportSummary)
      } catch {
        contextData = "\n[보고서 데이터 처리 중 오류가 발생했습니다.]"
      }
      break
    }

    case "scenario_analysis": {
      try {
        if (portfolioItems.length === 0) {
          contextData = "\n[포트폴리오가 비어 있습니다. 포트폴리오에 종목을 추가하면 시나리오 분석이 가능합니다.]"
          break
        }
        const macro = await fetchMacroData()
        contextData = buildScenarioAnalysisContext(
          userMessage,
          portfolioItems,
          macro
        )
      } catch {
        contextData = "\n[시나리오 분석 데이터 조회 중 오류가 발생했습니다.]"
      }
      break
    }

    case "greeting": {
      if (marketMode === "us") {
        const usMarket = await fetchUSMarketOverview()
        contextData = buildUSMarketOverviewContext(usMarket)
      } else {
        const market = await fetchMarketOverview()
        const themes = await fetchThemeData().catch(() => ({ themes: [], themeStocks: new Map() }))
        const marketCtx = buildMarketOverviewContext(market)
        const topThemes = themes.themes.slice(0, 3)
        const themeCtx = topThemes.length > 0
          ? buildThemesContext(topThemes, themes.themeStocks)
          : ""
        contextData = marketCtx + themeCtx
      }
      break
    }

    case "macro_economy": {
      const macro = await fetchMacroData()
      contextData = buildMacroContext(macro.korean, macro.global)
      break
    }

    case "ranking": {
      if (marketMode === "us") {
        const usRanking = await fetchUSRankingData()
        contextData = buildUSRankingContext(usRanking)
      } else {
        const ranking = await fetchRankingData()
        contextData = buildRankingContext(ranking)
      }
      break
    }

    case "theme_analysis": {
      if (marketMode === "us") {
        const usThemes = await fetchUSThemeData()
        contextData = buildUSThemesContext(usThemes)
      } else {
        const themeData = await fetchThemeData()
        contextData = buildThemesContext(themeData.themes, themeData.themeStocks)
      }
      break
    }

    case "corporate_events": {
      const events = await fetchCorporateEventsData(30)
      contextData = buildCorporateEventsContext(events)
      break
    }

    case "ipo": {
      if (marketMode === "us") {
        const usIpo = await fetchUSIPOData()
        contextData = buildUSIPOContext(usIpo)
      } else {
        const ipoItems = await fetchIpoData()
        contextData = buildIpoContext(ipoItems)
      }
      break
    }

    case "sector_rotation": {
      if (marketMode === "us") {
        const usSectors = await fetchUSSectorData()
        contextData = buildUSSectorContext(usSectors)
      } else {
        const sectors = await fetchSectorData()
        contextData = buildSectorRotationContext(sectors)
      }
      break
    }

    case "education": {
      // 교육 질문에는 추가 데이터 불필요
      break
    }

    default: {
      // stock_analysis 또는 general — 종목 추출 시도
      const potentialTickers = extractPotentialTickers(userMessage)
      const potentialNames = extractStockNames(userMessage)

      let resolved = null as Awaited<ReturnType<typeof resolveStock>> | null

      // 티커로 먼저 시도
      for (const ticker of potentialTickers) {
        resolved = await resolveStock(ticker)
        if (resolved) break
      }

      // 종목명으로 시도
      if (!resolved) {
        for (const name of potentialNames) {
          resolved = await resolveStock(name)
          if (resolved) break
        }
      }

      // 메시지 자체를 검색어로 시도 (짧은 단어 위주)
      if (!resolved) {
        const words = userMessage
          .replace(/[?？!！.。,，\s]+/g, " ")
          .trim()
          .split(" ")
          .filter((w) => w.length >= 2 && w.length <= 10)

        for (const word of words) {
          resolved = await resolveStock(word)
          if (resolved) {
            intent = "stock_analysis"
            break
          }
        }
      }

      if (resolved) {
        intent = "stock_analysis"
        const stockData = await fetchComprehensiveStockData(
          resolved.ticker,
          resolved.name
        )
        const rawContext = buildEnhancedStockContext(
          resolved.name,
          resolved.ticker,
          stockData
        )
        const analysis = runAnalysisPipeline(stockData)
        contextData = analysis ? `${analysis}\n\n${rawContext}` : rawContext
      }
      break
    }
  }

  return {
    blocked: false,
    systemPrompt: getIntentPrompt(intent, marketMode),
    contextData,
    intent,
  }
}
