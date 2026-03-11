import { describe, it, expect } from "vitest"
import { isValidTicker } from "../validate-ticker"

describe("isValidTicker", () => {
  describe("KR market", () => {
    it("accepts valid KR ticker codes", () => {
      expect(isValidTicker("005930", "KR")).toBe(true)
      expect(isValidTicker("000660", "KR")).toBe(true)
      expect(isValidTicker("SAMSUNG", "KR")).toBe(true)
    })

    it("rejects empty string", () => {
      expect(isValidTicker("", "KR")).toBe(false)
    })

    it("rejects special characters", () => {
      expect(isValidTicker("005930!", "KR")).toBe(false)
      expect(isValidTicker("00-59", "KR")).toBe(false)
    })

    it("rejects lowercase (case sensitive regex)", () => {
      // Ticker is uppercased inside the function
      expect(isValidTicker("abc", "KR")).toBe(true)
    })
  })

  describe("US market", () => {
    it("accepts valid US tickers", () => {
      expect(isValidTicker("AAPL", "US")).toBe(true)
      expect(isValidTicker("MSFT", "US")).toBe(true)
      expect(isValidTicker("GOOGL", "US")).toBe(true)
      expect(isValidTicker("BRK", "US")).toBe(true)
    })

    it("rejects empty string", () => {
      expect(isValidTicker("", "US")).toBe(false)
    })

    it("rejects special characters", () => {
      expect(isValidTicker("AA.PL", "US")).toBe(false)
      expect(isValidTicker("MS FT", "US")).toBe(false)
    })

    it("rejects excessively long tickers", () => {
      expect(isValidTicker("AVERYLONGTICKER", "US")).toBe(false)
    })
  })
})
