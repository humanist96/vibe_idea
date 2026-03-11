import { getTechnicalScore, type TechnicalIndicators } from "@/lib/analysis/technical"
import { getFundamentalScore } from "@/lib/analysis/fundamental"
import { getRatingFromScore, type AIScore, type Factor } from "./score-schema"
import type { NewsSentiment } from "@/lib/api/news-types"

interface FundamentalsInput {
  readonly per: number | null
  readonly pbr: number | null
  readonly eps: number | null
  readonly dividendYield: number | null
  readonly marketCap: number
  readonly priceChange52w: number
}

export interface FallbackInput {
  readonly stockName: string
  readonly technicalIndicators?: TechnicalIndicators
  readonly newsSentiment?: NewsSentiment | null
  readonly dataSources: AIScore["dataSources"]
  readonly newsHeadlines?: readonly string[]
  readonly fundamentals?: FundamentalsInput | null
}

export function generateFallbackScore(input: FallbackInput): AIScore {
  const { stockName, technicalIndicators, newsSentiment, dataSources, newsHeadlines, fundamentals } = input

  const techScore = technicalIndicators
    ? getTechnicalScore(technicalIndicators)
    : 5

  const fundScore = fundamentals
    ? getFundamentalScore(fundamentals)
    : 5

  const sentimentScore = newsSentiment ? newsSentiment.overallScore : 5
  const riskScore = 5

  const aiScore =
    Math.round(
      (techScore * 0.3 +
        fundScore * 0.3 +
        sentimentScore * 0.2 +
        riskScore * 0.2) *
        10
    ) / 10

  const factors: Factor[] = buildFactors(technicalIndicators, fundamentals, newsSentiment)

  return {
    aiScore,
    rating: getRatingFromScore(aiScore),
    probability: Math.round(aiScore * 8 + 10),
    technicalScore: techScore,
    fundamentalScore: fundScore,
    sentimentScore,
    riskScore,
    factors,
    summary: `${stockName} 종목에 대한 알고리즘 기반 분석 결과입니다. AI 분석이 불가하여 기술적/재무적 지표 기반으로 점수를 산출했습니다.`,
    keyInsight: "알고리즘 기반 분석 점수입니다.",
    dataSources: dataSources ?? {
      quote: false,
      technical: false,
      dart: false,
      financials: false,
      naverNews: false,
      googleNews: false,
    },
    newsHeadlines: newsHeadlines ? [...newsHeadlines] : undefined,
    analyzedAt: new Date().toISOString(),
  }
}

function buildFactors(
  technicalIndicators?: TechnicalIndicators,
  fundamentals?: FundamentalsInput | null,
  newsSentiment?: NewsSentiment | null,
): Factor[] {
  const factors: Factor[] = []

  if (technicalIndicators) {
    if (technicalIndicators.rsi < 30) {
      factors.push({ name: "RSI 과매도 구간", impact: "positive", strength: 4 })
    } else if (technicalIndicators.rsi > 70) {
      factors.push({ name: "RSI 과매수 구간", impact: "negative", strength: 4 })
    }

    if (technicalIndicators.macdHistogram > 0) {
      factors.push({ name: "MACD 상승 신호", impact: "positive", strength: 3 })
    } else {
      factors.push({ name: "MACD 하락 신호", impact: "negative", strength: 3 })
    }

    if (technicalIndicators.priceVsSma200 > 0) {
      factors.push({ name: "200일 이동평균 위 위치", impact: "positive", strength: 3 })
    } else {
      factors.push({ name: "200일 이동평균 아래 위치", impact: "negative", strength: 3 })
    }
  }

  if (fundamentals) {
    if (fundamentals.per !== null && fundamentals.per > 0 && fundamentals.per < 15) {
      factors.push({ name: "PER 저평가 구간", impact: "positive", strength: 4 })
    }
    if (fundamentals.pbr !== null && fundamentals.pbr > 0 && fundamentals.pbr < 1) {
      factors.push({ name: "PBR 1배 미만 저평가", impact: "positive", strength: 4 })
    }
    if (fundamentals.dividendYield !== null && fundamentals.dividendYield > 3) {
      factors.push({ name: "높은 배당수익률", impact: "positive", strength: 3 })
    }
  }

  if (newsSentiment && newsSentiment.articles.length > 0) {
    if (newsSentiment.overallScore >= 7) {
      factors.push({ name: "뉴스 감성 긍정적", impact: "positive", strength: 3 })
    } else if (newsSentiment.overallScore <= 3) {
      factors.push({ name: "뉴스 감성 부정적", impact: "negative", strength: 3 })
    } else {
      factors.push({ name: "뉴스 감성 중립", impact: "neutral", strength: 2 })
    }
  }

  if (factors.length < 3) {
    factors.push({ name: "데이터 제한으로 부분 분석", impact: "neutral", strength: 2 })
  }

  return factors
}
