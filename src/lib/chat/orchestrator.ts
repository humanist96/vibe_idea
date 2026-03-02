/**
 * 오케스트레이터 — 사용자 질문 의도 분류 + 데이터 수집 + 프롬프트 조합
 *
 * 흐름: 질문 → 컴플라이언스 체크 → 의도 분류 → 데이터 수집 → 프롬프트 빌드
 */

import { checkCompliance } from "./compliance"
import {
  resolveStock,
  fetchStockData,
  fetchMultipleStockData,
  fetchMarketOverview,
  resolveTickerNames,
} from "./data-fetcher"
import {
  SYSTEM_PROMPT,
  buildStockAnalysisContext,
  buildMarketOverviewContext,
  buildWatchlistContext,
} from "./prompts"

// ── Intent types ──────────────────────────────────────────────

export type Intent =
  | "stock_analysis"
  | "market_overview"
  | "watchlist_review"
  | "comparison"
  | "education"
  | "greeting"
  | "general"

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
      /포트폴리오\s*(?:리뷰|분석|현황|어때)/,
    ],
  },
  {
    intent: "comparison",
    patterns: [
      /vs|비교|대비|(?:이랑|하고|랑)\s*비교/,
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

// ── Main orchestrator ─────────────────────────────────────────

export async function orchestrate(
  userMessage: string,
  watchlistTickers: readonly string[] = []
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

  // 3. 데이터 수집 (의도에 따라)
  let contextData = ""

  switch (intent) {
    case "market_overview": {
      const market = await fetchMarketOverview()
      contextData = buildMarketOverviewContext(market)
      break
    }

    case "watchlist_review": {
      if (watchlistTickers.length === 0) {
        contextData = "\n[관심종목이 등록되어 있지 않습니다. 먼저 관심종목을 추가해주세요.]"
        break
      }
      const stocksMap = await fetchMultipleStockData(watchlistTickers)
      const nameMap = await resolveTickerNames(watchlistTickers)
      const watchlistStocks = watchlistTickers
        .map((ticker) => {
          const data = stocksMap.get(ticker)
          return {
            name: nameMap.get(ticker) ?? ticker,
            ticker,
            price: data?.quote?.price ?? 0,
            changePercent: data?.quote?.changePercent ?? 0,
            aiScore: data?.aiScore?.aiScore ?? null,
          }
        })
        .filter((s) => s.price > 0)
      contextData = buildWatchlistContext(watchlistStocks)
      break
    }

    case "greeting": {
      const market = await fetchMarketOverview()
      contextData = buildMarketOverviewContext(market)
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
        const stockData = await fetchStockData(resolved.ticker)
        if (stockData.quote) {
          contextData = buildStockAnalysisContext({
            name: resolved.name,
            ticker: resolved.ticker,
            price: stockData.quote.price,
            change: stockData.quote.change,
            changePercent: stockData.quote.changePercent,
            volume: stockData.quote.volume,
            marketCap: stockData.quote.marketCap,
            per: stockData.quote.per,
            pbr: stockData.quote.pbr,
            eps: stockData.quote.eps,
            dividendYield: stockData.quote.dividendYield,
            fiftyTwoWeekHigh: stockData.quote.fiftyTwoWeekHigh,
            fiftyTwoWeekLow: stockData.quote.fiftyTwoWeekLow,
            foreignRate: stockData.quote.foreignRate,
            aiScore: stockData.aiScore?.aiScore,
            aiRating: stockData.aiScore?.rating,
            aiSummary: stockData.aiScore?.summary,
            aiFactors: stockData.aiScore?.factors,
          })
        }
      }
      break
    }
  }

  return {
    blocked: false,
    systemPrompt: SYSTEM_PROMPT,
    contextData,
    intent,
  }
}
