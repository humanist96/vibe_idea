import { describe, it, expect } from "vitest"
import { getFundamentalScore, type FundamentalMetrics } from "../fundamental"

const baseMetrics: FundamentalMetrics = {
  per: 15,
  pbr: 1.2,
  eps: 3000,
  dividendYield: 2,
  marketCap: 100000000000,
  priceChange52w: 5,
}

describe("getFundamentalScore", () => {
  it("returns score between 1 and 10", () => {
    const score = getFundamentalScore(baseMetrics)
    expect(score).toBeGreaterThanOrEqual(1)
    expect(score).toBeLessThanOrEqual(10)
  })

  it("gives higher score for low PER", () => {
    const lowPer = { ...baseMetrics, per: 6 }
    const highPer = { ...baseMetrics, per: 35 }

    expect(getFundamentalScore(lowPer)).toBeGreaterThan(
      getFundamentalScore(highPer)
    )
  })

  it("gives higher score for low PBR", () => {
    const lowPbr = { ...baseMetrics, pbr: 0.5 }
    const highPbr = { ...baseMetrics, pbr: 4 }

    expect(getFundamentalScore(lowPbr)).toBeGreaterThan(
      getFundamentalScore(highPbr)
    )
  })

  it("gives bonus for high dividend yield", () => {
    const highDiv = { ...baseMetrics, dividendYield: 6 }
    const noDiv = { ...baseMetrics, dividendYield: 0 }

    expect(getFundamentalScore(highDiv)).toBeGreaterThan(
      getFundamentalScore(noDiv)
    )
  })

  it("handles null PER gracefully", () => {
    const nullPer = { ...baseMetrics, per: null }
    const score = getFundamentalScore(nullPer)
    expect(score).toBeGreaterThanOrEqual(1)
    expect(score).toBeLessThanOrEqual(10)
  })

  it("handles null PBR gracefully", () => {
    const nullPbr = { ...baseMetrics, pbr: null }
    const score = getFundamentalScore(nullPbr)
    expect(score).toBeGreaterThanOrEqual(1)
    expect(score).toBeLessThanOrEqual(10)
  })

  it("handles all null values", () => {
    const allNull: FundamentalMetrics = {
      per: null,
      pbr: null,
      eps: null,
      dividendYield: null,
      marketCap: 0,
      priceChange52w: 0,
    }
    const score = getFundamentalScore(allNull)
    expect(score).toBe(5)
  })

  it("gives bonus for strong 52-week performance", () => {
    const strong52w = { ...baseMetrics, priceChange52w: 50 }
    const weak52w = { ...baseMetrics, priceChange52w: -40 }

    expect(getFundamentalScore(strong52w)).toBeGreaterThan(
      getFundamentalScore(weak52w)
    )
  })

  it("handles zero PER (no division error)", () => {
    const zeroPer = { ...baseMetrics, per: 0 }
    const score = getFundamentalScore(zeroPer)
    expect(Number.isFinite(score)).toBe(true)
  })

  it("handles negative PER", () => {
    const negativePer = { ...baseMetrics, per: -5 }
    const score = getFundamentalScore(negativePer)
    expect(Number.isFinite(score)).toBe(true)
  })
})
