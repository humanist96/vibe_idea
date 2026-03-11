import { describe, it, expect } from "vitest"
import { checkRateLimit, AI_SCORE_RATE_LIMIT } from "../rate-limit"

describe("checkRateLimit", () => {
  const config = { maxRequests: 3, windowMs: 1000 }

  it("allows first request", () => {
    const result = checkRateLimit("test-allow-first", config)
    expect(result.allowed).toBe(true)
    expect(result.retryAfterMs).toBe(0)
  })

  it("allows requests within limit", () => {
    const key = "test-within-limit-" + Date.now()
    checkRateLimit(key, config)
    checkRateLimit(key, config)
    const result = checkRateLimit(key, config)
    expect(result.allowed).toBe(true)
  })

  it("blocks requests exceeding limit", () => {
    const key = "test-exceed-" + Date.now()
    checkRateLimit(key, config)
    checkRateLimit(key, config)
    checkRateLimit(key, config)
    const result = checkRateLimit(key, config)
    expect(result.allowed).toBe(false)
    expect(result.retryAfterMs).toBeGreaterThan(0)
  })

  it("uses different keys independently", () => {
    const ts = Date.now()
    const keyA = "test-a-" + ts
    const keyB = "test-b-" + ts

    checkRateLimit(keyA, config)
    checkRateLimit(keyA, config)
    checkRateLimit(keyA, config)

    const resultA = checkRateLimit(keyA, config)
    const resultB = checkRateLimit(keyB, config)

    expect(resultA.allowed).toBe(false)
    expect(resultB.allowed).toBe(true)
  })
})

describe("AI_SCORE_RATE_LIMIT", () => {
  it("has expected values", () => {
    expect(AI_SCORE_RATE_LIMIT.maxRequests).toBe(10)
    expect(AI_SCORE_RATE_LIMIT.windowMs).toBe(60_000)
  })
})
