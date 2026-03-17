import { describe, it, expect } from "vitest"
import { buildRiskAlerts, buildAnalystDigest } from "../analyzer"
import type { StockReportData } from "../types"
import type { TechnicalIndicators } from "@/lib/analysis/technical"

// ── Helpers ──────────────────────────────────────────────────────

function makeStock(overrides: Partial<StockReportData> = {}): StockReportData {
  return {
    ticker: "005930",
    name: "삼성전자",
    quote: {
      ticker: "005930",
      name: "삼성전자",
      price: 60000,
      change: 1000,
      changePercent: 1.69,
      volume: 1000000,
      marketCap: 360000000000000,
      previousClose: 59000,
      dayHigh: 61000,
      dayLow: 59000,
      fiftyTwoWeekHigh: 70000,
      fiftyTwoWeekLow: 50000,
      per: 12,
      pbr: 1.2,
      eps: 5000,
      dividendYield: 2.5,
      foreignRate: 50,
    },
    historical: [
      { date: "2026-03-07", open: 58000, high: 59000, low: 57000, close: 58000, volume: 800000 },
      { date: "2026-03-08", open: 58500, high: 59500, low: 58000, close: 59000, volume: 900000 },
      { date: "2026-03-09", open: 59000, high: 60000, low: 58500, close: 59500, volume: 850000 },
      { date: "2026-03-10", open: 59500, high: 60500, low: 59000, close: 59000, volume: 950000 },
      { date: "2026-03-11", open: 59000, high: 61000, low: 59000, close: 60000, volume: 1000000 },
    ],
    investorFlow: null,
    consensus: null,
    insider: [],
    blockHoldings: [],
    news: [],
    events: [],
    technical: null,
    sentiment: null,
    aiScore: null,
    ...overrides,
  }
}

const NEUTRAL_TECHNICAL: TechnicalIndicators = {
  rsi: 50,
  macdLine: 0,
  macdSignal: 0,
  macdHistogram: 0,
  sma20: 60000,
  sma50: 58000,
  sma200: 55000,
  ema12: 59500,
  ema26: 58500,
  bollingerUpper: 63000,
  bollingerMiddle: 60000,
  bollingerLower: 57000,
  atr: 1000,
  priceVsSma20: 0,
  priceVsSma50: 3.4,
  priceVsSma200: 9.1,
  volumeRatio: 1,
}

// ── buildRiskAlerts ─────────────────────────────────────────────

describe("buildRiskAlerts", () => {
  it("returns empty array when no risk conditions met", () => {
    const stock = makeStock({ technical: NEUTRAL_TECHNICAL })
    const alerts = buildRiskAlerts(stock)
    expect(alerts).toEqual([])
  })

  it("detects RSI overbought (>70)", () => {
    const stock = makeStock({
      technical: { ...NEUTRAL_TECHNICAL, rsi: 78 },
    })
    const alerts = buildRiskAlerts(stock)
    expect(alerts).toHaveLength(1)
    expect(alerts[0].level).toBe("warning")
    expect(alerts[0].label).toBe("RSI 과매수")
    expect(alerts[0].detail).toContain("78")
  })

  it("detects RSI oversold (<30)", () => {
    const stock = makeStock({
      technical: { ...NEUTRAL_TECHNICAL, rsi: 22 },
    })
    const alerts = buildRiskAlerts(stock)
    expect(alerts).toHaveLength(1)
    expect(alerts[0].level).toBe("info")
    expect(alerts[0].label).toBe("RSI 과매도")
  })

  it("detects MACD death cross", () => {
    const stock = makeStock({
      technical: { ...NEUTRAL_TECHNICAL, macdHistogram: -50, macdLine: -10, macdSignal: 5 },
    })
    const alerts = buildRiskAlerts(stock)
    expect(alerts.some((a) => a.label === "MACD 데드크로스")).toBe(true)
  })

  it("does not trigger MACD alert when histogram positive", () => {
    const stock = makeStock({
      technical: { ...NEUTRAL_TECHNICAL, macdHistogram: 50, macdLine: 10, macdSignal: 5 },
    })
    const alerts = buildRiskAlerts(stock)
    expect(alerts.some((a) => a.label === "MACD 데드크로스")).toBe(false)
  })

  it("detects consecutive foreign selling (4+ of 5 days)", () => {
    const stock = makeStock({
      investorFlow: {
        ticker: "005930",
        entries: [
          { date: "2026-03-11", close: 60000, change: 1000, changePercent: 1.69, volume: 1000000, foreignNet: -500, institutionNet: 100, foreignHolding: 5000000, foreignRatio: 50 },
          { date: "2026-03-10", close: 59000, change: -500, changePercent: -0.84, volume: 950000, foreignNet: -300, institutionNet: 200, foreignHolding: 5000500, foreignRatio: 50 },
          { date: "2026-03-09", close: 59500, change: 500, changePercent: 0.85, volume: 850000, foreignNet: -200, institutionNet: 50, foreignHolding: 5000800, foreignRatio: 50 },
          { date: "2026-03-08", close: 59000, change: 1000, changePercent: 1.72, volume: 900000, foreignNet: 100, institutionNet: -50, foreignHolding: 5001000, foreignRatio: 50 },
          { date: "2026-03-07", close: 58000, change: -1000, changePercent: -1.69, volume: 800000, foreignNet: -400, institutionNet: 300, foreignHolding: 5000900, foreignRatio: 50 },
        ],
      },
    })
    const alerts = buildRiskAlerts(stock)
    const foreignAlert = alerts.find((a) => a.label === "외국인 연속 매도")
    expect(foreignAlert).toBeDefined()
    expect(foreignAlert!.level).toBe("critical")
    expect(foreignAlert!.detail).toContain("4일")
  })

  it("does not trigger foreign selling when only 2 of 5 days negative", () => {
    const stock = makeStock({
      investorFlow: {
        ticker: "005930",
        entries: [
          { date: "2026-03-11", close: 60000, change: 0, changePercent: 0, volume: 1000000, foreignNet: -100, institutionNet: 0, foreignHolding: 5000000, foreignRatio: 50 },
          { date: "2026-03-10", close: 60000, change: 0, changePercent: 0, volume: 1000000, foreignNet: 200, institutionNet: 0, foreignHolding: 5000100, foreignRatio: 50 },
          { date: "2026-03-09", close: 60000, change: 0, changePercent: 0, volume: 1000000, foreignNet: 300, institutionNet: 0, foreignHolding: 4999900, foreignRatio: 50 },
          { date: "2026-03-08", close: 60000, change: 0, changePercent: 0, volume: 1000000, foreignNet: -50, institutionNet: 0, foreignHolding: 4999600, foreignRatio: 50 },
          { date: "2026-03-07", close: 60000, change: 0, changePercent: 0, volume: 1000000, foreignNet: 150, institutionNet: 0, foreignHolding: 4999650, foreignRatio: 50 },
        ],
      },
    })
    const alerts = buildRiskAlerts(stock)
    expect(alerts.some((a) => a.label === "외국인 연속 매도")).toBe(false)
  })

  it("detects volume spike (>3x average)", () => {
    const stock = makeStock({
      quote: {
        ticker: "005930", name: "삼성전자",
        price: 60000, change: 1000, changePercent: 1.69,
        volume: 5000000, // 5M vs ~875K avg → ~5.7x
        marketCap: 360000000000000, previousClose: 59000,
        dayHigh: 61000, dayLow: 59000,
        fiftyTwoWeekHigh: 70000, fiftyTwoWeekLow: 50000,
        per: 12, pbr: 1.2, eps: 5000, dividendYield: 2.5, foreignRate: 50,
      },
    })
    const alerts = buildRiskAlerts(stock)
    expect(alerts.some((a) => a.label === "거래량 급증")).toBe(true)
  })

  it("detects target price exceeded (>10% above)", () => {
    const stock = makeStock({
      consensus: {
        consensus: { targetPrice: 50000, investmentOpinion: "매수", analystCount: 10 },
        reports: [],
      },
    })
    // price 60000 vs target 50000 → 20% above → should trigger
    const alerts = buildRiskAlerts(stock)
    const targetAlert = alerts.find((a) => a.label === "목표가 초과")
    expect(targetAlert).toBeDefined()
    expect(targetAlert!.detail).toContain("20%")
  })

  it("does not trigger target price alert when price below target", () => {
    const stock = makeStock({
      consensus: {
        consensus: { targetPrice: 80000, investmentOpinion: "매수", analystCount: 10 },
        reports: [],
      },
    })
    const alerts = buildRiskAlerts(stock)
    expect(alerts.some((a) => a.label === "목표가 초과")).toBe(false)
  })

  it("handles stock with no technical/quote data", () => {
    const stock = makeStock({ quote: null, technical: null, historical: [] })
    const alerts = buildRiskAlerts(stock)
    expect(alerts).toEqual([])
  })

  it("can detect multiple alerts simultaneously", () => {
    const stock = makeStock({
      technical: { ...NEUTRAL_TECHNICAL, rsi: 82, macdHistogram: -10, macdLine: -5, macdSignal: 2 },
      consensus: {
        consensus: { targetPrice: 50000, investmentOpinion: "중립", analystCount: 5 },
        reports: [],
      },
    })
    const alerts = buildRiskAlerts(stock)
    expect(alerts.length).toBeGreaterThanOrEqual(3) // RSI + MACD + target
    expect(alerts.some((a) => a.label === "RSI 과매수")).toBe(true)
    expect(alerts.some((a) => a.label === "MACD 데드크로스")).toBe(true)
    expect(alerts.some((a) => a.label === "목표가 초과")).toBe(true)
  })
})

// ── buildAnalystDigest ──────────────────────────────────────────

describe("buildAnalystDigest", () => {
  it("returns null when no consensus data", () => {
    const stock = makeStock({ consensus: null })
    expect(buildAnalystDigest(stock, "")).toBeNull()
  })

  it("calculates target price upside correctly", () => {
    const stock = makeStock({
      consensus: {
        consensus: { targetPrice: 78000, investmentOpinion: "매수", analystCount: 15 },
        reports: [],
      },
    })
    const digest = buildAnalystDigest(stock, "AI 요약")
    expect(digest).not.toBeNull()
    // (78000 - 60000) / 60000 * 100 = 30.0%
    expect(digest!.targetPriceUpside).toBe(30)
    expect(digest!.summary).toBe("AI 요약")
  })

  it("calculates negative upside when price above target", () => {
    const stock = makeStock({
      consensus: {
        consensus: { targetPrice: 50000, investmentOpinion: "중립", analystCount: 5 },
        reports: [],
      },
    })
    const digest = buildAnalystDigest(stock, "")
    // (50000 - 60000) / 60000 * 100 = -16.7%
    expect(digest!.targetPriceUpside).toBeCloseTo(-16.7, 0)
  })

  it("uses fallback summary when aiDigest is empty", () => {
    const stock = makeStock({
      consensus: {
        consensus: { targetPrice: 75000, investmentOpinion: "적극 매수", analystCount: 20 },
        reports: [],
      },
    })
    const digest = buildAnalystDigest(stock, "")
    expect(digest!.summary).toContain("적극 매수")
    expect(digest!.summary).toContain("75,000원")
  })

  it("detects upward opinion trend", () => {
    const stock = makeStock({
      consensus: {
        consensus: { targetPrice: 75000, investmentOpinion: "매수", analystCount: 4 },
        reports: [
          { title: "A", provider: "증권사A", date: "2026.03.10", targetPrice: 80000 },
          { title: "B", provider: "증권사B", date: "2026.03.08", targetPrice: 78000 },
          { title: "C", provider: "증권사C", date: "2026.02.20", targetPrice: 70000 },
          { title: "D", provider: "증권사D", date: "2026.02.15", targetPrice: 68000 },
        ],
      },
    })
    const digest = buildAnalystDigest(stock, "요약")
    expect(digest!.opinionTrend).toBe("상향")
  })

  it("detects downward opinion trend", () => {
    const stock = makeStock({
      consensus: {
        consensus: { targetPrice: 55000, investmentOpinion: "중립", analystCount: 4 },
        reports: [
          { title: "A", provider: "증권사A", date: "2026.03.10", targetPrice: 55000 },
          { title: "B", provider: "증권사B", date: "2026.03.08", targetPrice: 58000 },
          { title: "C", provider: "증권사C", date: "2026.02.20", targetPrice: 70000 },
          { title: "D", provider: "증권사D", date: "2026.02.15", targetPrice: 72000 },
        ],
      },
    })
    const digest = buildAnalystDigest(stock, "")
    expect(digest!.opinionTrend).toBe("하향")
  })

  it("detects stable opinion trend", () => {
    const stock = makeStock({
      consensus: {
        consensus: { targetPrice: 65000, investmentOpinion: "매수", analystCount: 4 },
        reports: [
          { title: "A", provider: "증권사A", date: "2026.03.10", targetPrice: 65000 },
          { title: "B", provider: "증권사B", date: "2026.03.08", targetPrice: 64000 },
          { title: "C", provider: "증권사C", date: "2026.02.20", targetPrice: 65000 },
          { title: "D", provider: "증권사D", date: "2026.02.15", targetPrice: 64500 },
        ],
      },
    })
    const digest = buildAnalystDigest(stock, "")
    expect(digest!.opinionTrend).toBe("유지")
  })

  it("returns null trend when less than 2 reports with prices", () => {
    const stock = makeStock({
      consensus: {
        consensus: { targetPrice: 70000, investmentOpinion: "매수", analystCount: 1 },
        reports: [
          { title: "A", provider: "증권사A", date: "2026.03.10", targetPrice: 70000 },
        ],
      },
    })
    const digest = buildAnalystDigest(stock, "")
    expect(digest!.opinionTrend).toBeNull()
  })

  it("limits recent reports to 5", () => {
    const reports = Array.from({ length: 10 }, (_, i) => ({
      title: `리포트${i}`,
      provider: `증권사${i}`,
      date: "2026.03.10",
      targetPrice: 70000 + i * 1000,
    }))
    const stock = makeStock({
      consensus: {
        consensus: { targetPrice: 75000, investmentOpinion: "매수", analystCount: 10 },
        reports,
      },
    })
    const digest = buildAnalystDigest(stock, "요약")
    expect(digest!.recentReports).toHaveLength(5)
  })

  it("handles null targetPrice in consensus", () => {
    const stock = makeStock({
      consensus: {
        consensus: { targetPrice: null, investmentOpinion: "중립", analystCount: 3 },
        reports: [],
      },
    })
    const digest = buildAnalystDigest(stock, "")
    expect(digest!.targetPriceUpside).toBeNull()
    expect(digest!.summary).toContain("미제시")
  })
})
