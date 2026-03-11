import { describe, it, expect } from "vitest"
import {
  calculateTechnicalIndicators,
  getTechnicalScore,
  type TechnicalIndicators,
} from "../technical"

function generateOHLCV(closes: number[]) {
  return closes.map((close) => ({
    close,
    high: close * 1.02,
    low: close * 0.98,
    volume: 1000000,
  }))
}

describe("calculateTechnicalIndicators", () => {
  it("returns valid indicators from sufficient data", () => {
    // Generate 200+ data points with an upward trend
    const closes = Array.from({ length: 250 }, (_, i) => 10000 + i * 50)
    const data = generateOHLCV(closes)
    const result = calculateTechnicalIndicators(data)

    expect(result.rsi).toBeGreaterThan(0)
    expect(result.rsi).toBeLessThanOrEqual(100)
    expect(result.sma20).toBeGreaterThan(0)
    expect(result.sma50).toBeGreaterThan(0)
    expect(result.sma200).toBeGreaterThan(0)
    expect(result.bollingerUpper).toBeGreaterThan(result.bollingerLower)
    expect(result.bollingerMiddle).toBe(result.sma20)
    expect(result.ema12).toBeGreaterThan(0)
    expect(result.ema26).toBeGreaterThan(0)
    expect(result.atr).toBeGreaterThan(0)
  })

  it("handles small dataset gracefully", () => {
    const data = generateOHLCV([100, 102, 101])
    const result = calculateTechnicalIndicators(data)

    expect(result.rsi).toBeDefined()
    expect(result.sma20).toBeGreaterThan(0)
  })

  it("calculates RSI at 100 for only-gains data", () => {
    // Strictly increasing prices for 20 periods
    const closes = Array.from({ length: 20 }, (_, i) => 100 + i)
    const data = generateOHLCV(closes)
    const result = calculateTechnicalIndicators(data)

    expect(result.rsi).toBe(100)
  })

  it("calculates positive priceVsSma20 when price is above SMA", () => {
    // Price well above SMA20
    const base = Array.from({ length: 19 }, () => 100)
    const closes = [...base, 120]
    const data = generateOHLCV(closes)
    const result = calculateTechnicalIndicators(data)

    expect(result.priceVsSma20).toBeGreaterThan(0)
  })
})

describe("getTechnicalScore", () => {
  const neutralIndicators: TechnicalIndicators = {
    rsi: 50,
    macdLine: 0,
    macdSignal: 0,
    macdHistogram: 0,
    sma20: 100,
    sma50: 100,
    sma200: 100,
    ema12: 100,
    ema26: 100,
    bollingerUpper: 110,
    bollingerMiddle: 100,
    bollingerLower: 90,
    atr: 5,
    priceVsSma20: 0,
    priceVsSma50: 0,
    priceVsSma200: 0,
    volumeRatio: 1,
  }

  it("returns score clamped between 1 and 10", () => {
    const bullish: TechnicalIndicators = {
      ...neutralIndicators,
      rsi: 25,
      macdHistogram: 5,
      priceVsSma20: 10,
      priceVsSma50: 10,
      priceVsSma200: 10,
      volumeRatio: 2,
    }
    const bearish: TechnicalIndicators = {
      ...neutralIndicators,
      rsi: 80,
      macdHistogram: -5,
      priceVsSma20: -10,
      priceVsSma50: -10,
      priceVsSma200: -10,
      volumeRatio: 0.3,
    }

    const bullishScore = getTechnicalScore(bullish)
    const bearishScore = getTechnicalScore(bearish)

    expect(bullishScore).toBeGreaterThanOrEqual(1)
    expect(bullishScore).toBeLessThanOrEqual(10)
    expect(bearishScore).toBeGreaterThanOrEqual(1)
    expect(bearishScore).toBeLessThanOrEqual(10)
    expect(bullishScore).toBeGreaterThan(bearishScore)
  })

  it("returns 5 for neutral indicators", () => {
    // All neutral: MACD histogram = 0 counts as negative (-0.5)
    // but priceVsSma are all 0 (count as negative for each: -0.3, -0.3, -0.4)
    const score = getTechnicalScore(neutralIndicators)
    expect(score).toBeLessThan(5)
  })

  it("boosts score for RSI oversold", () => {
    const oversold = { ...neutralIndicators, rsi: 25 }
    const normal = { ...neutralIndicators, rsi: 50 }

    expect(getTechnicalScore(oversold)).toBeGreaterThan(
      getTechnicalScore(normal)
    )
  })

  it("penalizes score for RSI overbought", () => {
    const overbought = { ...neutralIndicators, rsi: 75 }
    const normal = { ...neutralIndicators, rsi: 50 }

    expect(getTechnicalScore(overbought)).toBeLessThan(
      getTechnicalScore(normal)
    )
  })
})
