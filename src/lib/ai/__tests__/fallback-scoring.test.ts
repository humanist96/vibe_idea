import { describe, it, expect } from "vitest"
import { generateFallbackScore, type FallbackInput } from "../fallback-scoring"
import type { TechnicalIndicators } from "@/lib/analysis/technical"

const baseTechnicalIndicators: TechnicalIndicators = {
  rsi: 45,
  macdLine: 0.5,
  macdSignal: 0.3,
  macdHistogram: 0.2,
  sma20: 50000,
  sma50: 48000,
  sma200: 45000,
  ema12: 51000,
  ema26: 49000,
  bollingerUpper: 55000,
  bollingerMiddle: 50000,
  bollingerLower: 45000,
  atr: 1500,
  priceVsSma20: 2,
  priceVsSma50: 5,
  priceVsSma200: 10,
  volumeRatio: 1.2,
}

describe("generateFallbackScore", () => {
  it("returns a valid AIScore with all data", () => {
    const input: FallbackInput = {
      stockName: "삼성전자",
      technicalIndicators: baseTechnicalIndicators,
      dataSources: {
        quote: true,
        technical: true,
        dart: false,
        financials: false,
        naverNews: false,
        googleNews: false,
      },
      fundamentals: {
        per: 10,
        pbr: 0.9,
        eps: 5000,
        dividendYield: 3.5,
        marketCap: 300000000000000,
        priceChange52w: 15,
      },
    }

    const result = generateFallbackScore(input)

    expect(result.aiScore).toBeGreaterThanOrEqual(1)
    expect(result.aiScore).toBeLessThanOrEqual(10)
    expect(result.rating).toBeDefined()
    expect(result.probability).toBeGreaterThanOrEqual(0)
    expect(result.probability).toBeLessThanOrEqual(100)
    expect(result.factors.length).toBeGreaterThanOrEqual(3)
    expect(result.summary).toContain("삼성전자")
    expect(result.analyzedAt).toBeDefined()
  })

  it("returns default score 5 when no data provided", () => {
    const input: FallbackInput = {
      stockName: "테스트",
      dataSources: undefined,
    }

    const result = generateFallbackScore(input)

    expect(result.aiScore).toBe(5)
    expect(result.technicalScore).toBe(5)
    expect(result.fundamentalScore).toBe(5)
    expect(result.sentimentScore).toBe(5)
    expect(result.riskScore).toBe(5)
    expect(result.factors.length).toBeGreaterThanOrEqual(1)
  })

  it("generates factors from RSI oversold", () => {
    const input: FallbackInput = {
      stockName: "테스트",
      technicalIndicators: { ...baseTechnicalIndicators, rsi: 25 },
      dataSources: undefined,
    }

    const result = generateFallbackScore(input)
    const rsiFactors = result.factors.filter((f) => f.name.includes("RSI"))
    expect(rsiFactors.length).toBe(1)
    expect(rsiFactors[0].impact).toBe("positive")
  })

  it("generates factors from RSI overbought", () => {
    const input: FallbackInput = {
      stockName: "테스트",
      technicalIndicators: { ...baseTechnicalIndicators, rsi: 75 },
      dataSources: undefined,
    }

    const result = generateFallbackScore(input)
    const rsiFactors = result.factors.filter((f) => f.name.includes("RSI"))
    expect(rsiFactors.length).toBe(1)
    expect(rsiFactors[0].impact).toBe("negative")
  })

  it("generates PER factor for undervalued stock", () => {
    const input: FallbackInput = {
      stockName: "테스트",
      dataSources: undefined,
      fundamentals: {
        per: 8,
        pbr: 0.5,
        eps: 3000,
        dividendYield: 4,
        marketCap: 100000000000,
        priceChange52w: 10,
      },
    }

    const result = generateFallbackScore(input)
    const perFactors = result.factors.filter((f) => f.name.includes("PER"))
    expect(perFactors.length).toBe(1)
    expect(perFactors[0].impact).toBe("positive")
  })
})
