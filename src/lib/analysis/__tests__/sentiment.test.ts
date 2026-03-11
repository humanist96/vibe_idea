import { describe, it, expect } from "vitest"
import { analyzeNewsSentiment } from "../sentiment"

function makeArticle(title: string) {
  return {
    title,
    url: "https://example.com",
    source: "Test",
    publishedAt: "2026-01-01",
  }
}

describe("analyzeNewsSentiment", () => {
  it("returns neutral score for empty articles", () => {
    const result = analyzeNewsSentiment([])
    expect(result.overallScore).toBe(5)
    expect(result.positiveCount).toBe(0)
    expect(result.negativeCount).toBe(0)
    expect(result.neutralCount).toBe(0)
    expect(result.articles).toEqual([])
    expect(result.keywords).toEqual([])
  })

  it("detects positive sentiment from keywords", () => {
    const articles = [
      makeArticle("삼성전자 실적 호실적으로 급등"),
      makeArticle("삼성전자 목표가상향 매수 추천"),
    ]
    const result = analyzeNewsSentiment(articles)

    expect(result.positiveCount).toBeGreaterThan(0)
    expect(result.overallScore).toBeGreaterThan(5)
    expect(result.keywords.length).toBeGreaterThan(0)
  })

  it("detects negative sentiment from keywords", () => {
    const articles = [
      makeArticle("LG화학 급락 실적부진 우려"),
      makeArticle("LG화학 적자전환 매도 추천"),
    ]
    const result = analyzeNewsSentiment(articles)

    expect(result.negativeCount).toBeGreaterThan(0)
    expect(result.overallScore).toBeLessThan(5)
  })

  it("returns neutral for articles without keywords", () => {
    const articles = [
      makeArticle("삼성전자 정기 주주총회 개최"),
      makeArticle("현대차 신차 발표회 예정"),
    ]
    const result = analyzeNewsSentiment(articles)

    expect(result.neutralCount).toBe(2)
    // Normalized score for all-neutral rounds to 5 or 6
    expect(result.overallScore).toBeGreaterThanOrEqual(5)
    expect(result.overallScore).toBeLessThanOrEqual(6)
  })

  it("returns overallScore between 1 and 10", () => {
    const manyPositive = Array.from({ length: 20 }, () =>
      makeArticle("급등 상승 돌파 호실적 매수 성장")
    )
    const manyNegative = Array.from({ length: 20 }, () =>
      makeArticle("급락 하락 적자 매도 손실 하향")
    )

    const positive = analyzeNewsSentiment(manyPositive)
    const negative = analyzeNewsSentiment(manyNegative)

    expect(positive.overallScore).toBeGreaterThanOrEqual(1)
    expect(positive.overallScore).toBeLessThanOrEqual(10)
    expect(negative.overallScore).toBeGreaterThanOrEqual(1)
    expect(negative.overallScore).toBeLessThanOrEqual(10)
  })

  it("limits keywords to at most 10", () => {
    const articles = Array.from({ length: 30 }, () =>
      makeArticle("급등 상승 돌파 호실적 매수 성장 호재 수주 흑자전환 사상최대 배당확대 신고가")
    )
    const result = analyzeNewsSentiment(articles)
    expect(result.keywords.length).toBeLessThanOrEqual(10)
  })
})
