import type { NewsArticle, NewsSentiment } from "@/lib/api/news-types"

const POSITIVE_KEYWORDS: readonly string[] = [
  "급등", "상승", "최고", "돌파", "호실적", "매수", "성장",
  "호재", "수주", "흑자전환", "사상최대", "배당확대", "신고가",
  "상한가", "강세", "반등", "회복", "개선", "증가", "확대",
  "호조", "수혜", "기대", "낙관", "목표가상향", "투자의견상향",
  "어닝서프라이즈", "실적개선", "매출증가", "영업이익증가",
  "순이익증가", "수출증가", "점유율확대", "신사업", "혁신",
  "계약체결", "인수", "합병", "상장", "IPO",
]

const NEGATIVE_KEYWORDS: readonly string[] = [
  "급락", "하락", "최저", "적자", "매도", "하향", "손실",
  "악재", "감소", "소송", "리스크", "실적부진", "신저가",
  "하한가", "약세", "하방", "부진", "악화", "축소", "위축",
  "적자전환", "목표가하향", "투자의견하향", "어닝쇼크",
  "실적악화", "매출감소", "영업손실", "순손실", "수출감소",
  "점유율하락", "철수", "파산", "상장폐지", "불확실",
  "조정", "과열", "거품", "규제", "제재", "벌금",
]

interface SentimentResult {
  readonly sentiment: "positive" | "negative" | "neutral"
  readonly matchedKeywords: readonly string[]
  readonly score: number
}

function analyzeTitle(title: string): SentimentResult {
  const matchedPositive = POSITIVE_KEYWORDS.filter((kw) =>
    title.includes(kw)
  )
  const matchedNegative = NEGATIVE_KEYWORDS.filter((kw) =>
    title.includes(kw)
  )

  const positiveScore = matchedPositive.length
  const negativeScore = matchedNegative.length

  if (positiveScore > negativeScore) {
    return {
      sentiment: "positive",
      matchedKeywords: matchedPositive,
      score: Math.min(positiveScore, 3),
    }
  }

  if (negativeScore > positiveScore) {
    return {
      sentiment: "negative",
      matchedKeywords: matchedNegative,
      score: -Math.min(negativeScore, 3),
    }
  }

  return {
    sentiment: "neutral",
    matchedKeywords: [...matchedPositive, ...matchedNegative],
    score: 0,
  }
}

export function analyzeNewsSentiment(
  articles: readonly NewsArticle[]
): NewsSentiment {
  if (articles.length === 0) {
    return {
      articles: [],
      positiveCount: 0,
      negativeCount: 0,
      neutralCount: 0,
      overallScore: 5,
      keywords: [],
    }
  }

  let positiveCount = 0
  let negativeCount = 0
  let neutralCount = 0
  let totalScore = 0
  const allKeywords: string[] = []

  for (const article of articles) {
    const result = analyzeTitle(article.title)

    if (result.sentiment === "positive") positiveCount++
    else if (result.sentiment === "negative") negativeCount++
    else neutralCount++

    totalScore += result.score
    allKeywords.push(...result.matchedKeywords)
  }

  // Calculate overall score (1-10 scale)
  // totalScore ranges from roughly -3*N to +3*N
  const maxPossibleScore = articles.length * 3
  const normalizedScore =
    maxPossibleScore > 0
      ? (totalScore + maxPossibleScore) / (2 * maxPossibleScore)
      : 0.5

  // Map to 1-10 range
  const overallScore = Math.max(
    1,
    Math.min(10, Math.round(normalizedScore * 9 + 1))
  )

  // Deduplicate and take top keywords
  const uniqueKeywords = [...new Set(allKeywords)].slice(0, 10)

  return {
    articles,
    positiveCount,
    negativeCount,
    neutralCount,
    overallScore,
    keywords: uniqueKeywords,
  }
}
