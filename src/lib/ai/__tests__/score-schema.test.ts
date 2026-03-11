import { describe, it, expect } from "vitest"
import {
  AIScoreSchema,
  FactorSchema,
  getRatingFromScore,
  getRatingColor,
  getRatingBadgeVariant,
} from "../score-schema"

describe("FactorSchema", () => {
  it("validates a correct factor", () => {
    const factor = { name: "RSI 과매도", impact: "positive", strength: 4 }
    expect(FactorSchema.parse(factor)).toEqual(factor)
  })

  it("rejects strength out of range", () => {
    expect(() =>
      FactorSchema.parse({ name: "Test", impact: "positive", strength: 6 })
    ).toThrow()
    expect(() =>
      FactorSchema.parse({ name: "Test", impact: "positive", strength: 0 })
    ).toThrow()
  })

  it("rejects invalid impact", () => {
    expect(() =>
      FactorSchema.parse({ name: "Test", impact: "unknown", strength: 3 })
    ).toThrow()
  })
})

describe("AIScoreSchema", () => {
  const validScore = {
    aiScore: 7.5,
    rating: "Buy" as const,
    probability: 65,
    technicalScore: 7,
    fundamentalScore: 6,
    sentimentScore: 8,
    riskScore: 5,
    factors: [
      { name: "RSI", impact: "positive" as const, strength: 4 },
      { name: "MACD", impact: "negative" as const, strength: 3 },
      { name: "PER", impact: "neutral" as const, strength: 2 },
    ],
    summary: "Test summary",
    keyInsight: "Key insight here",
  }

  it("validates a complete score", () => {
    expect(AIScoreSchema.parse(validScore)).toMatchObject(validScore)
  })

  it("rejects aiScore out of range", () => {
    expect(() =>
      AIScoreSchema.parse({ ...validScore, aiScore: 0 })
    ).toThrow()
    expect(() =>
      AIScoreSchema.parse({ ...validScore, aiScore: 11 })
    ).toThrow()
  })

  it("rejects fewer than 3 factors", () => {
    expect(() =>
      AIScoreSchema.parse({
        ...validScore,
        factors: [{ name: "A", impact: "positive", strength: 1 }],
      })
    ).toThrow()
  })

  it("accepts optional fields", () => {
    const result = AIScoreSchema.parse(validScore)
    expect(result.dataSources).toBeUndefined()
    expect(result.newsHeadlines).toBeUndefined()
  })
})

describe("getRatingFromScore", () => {
  it("returns Strong Buy for score >= 8.5", () => {
    expect(getRatingFromScore(8.5)).toBe("Strong Buy")
    expect(getRatingFromScore(10)).toBe("Strong Buy")
  })

  it("returns Buy for score >= 7", () => {
    expect(getRatingFromScore(7)).toBe("Buy")
    expect(getRatingFromScore(8.4)).toBe("Buy")
  })

  it("returns Hold for score >= 4", () => {
    expect(getRatingFromScore(4)).toBe("Hold")
    expect(getRatingFromScore(6.9)).toBe("Hold")
  })

  it("returns Sell for score >= 2.5", () => {
    expect(getRatingFromScore(2.5)).toBe("Sell")
    expect(getRatingFromScore(3.9)).toBe("Sell")
  })

  it("returns Strong Sell for score < 2.5", () => {
    expect(getRatingFromScore(1)).toBe("Strong Sell")
    expect(getRatingFromScore(2.4)).toBe("Strong Sell")
  })
})

describe("getRatingColor", () => {
  it("returns a CSS class for each rating", () => {
    expect(getRatingColor("Strong Buy")).toContain("text-")
    expect(getRatingColor("Buy")).toContain("text-")
    expect(getRatingColor("Hold")).toContain("text-")
    expect(getRatingColor("Sell")).toContain("text-")
    expect(getRatingColor("Strong Sell")).toContain("text-")
  })
})

describe("getRatingBadgeVariant", () => {
  it("returns red for buy ratings", () => {
    expect(getRatingBadgeVariant("Strong Buy")).toBe("red")
    expect(getRatingBadgeVariant("Buy")).toBe("red")
  })

  it("returns yellow for Hold", () => {
    expect(getRatingBadgeVariant("Hold")).toBe("yellow")
  })

  it("returns blue for sell ratings", () => {
    expect(getRatingBadgeVariant("Sell")).toBe("blue")
    expect(getRatingBadgeVariant("Strong Sell")).toBe("blue")
  })
})
