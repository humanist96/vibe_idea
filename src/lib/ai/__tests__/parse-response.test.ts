import { describe, it, expect } from "vitest"
import { parseAIJsonResponse } from "../parse-response"

describe("parseAIJsonResponse", () => {
  it("parses plain JSON string", () => {
    const input = '{"score": 8, "rating": "Buy"}'
    const result = parseAIJsonResponse(input)
    expect(result).toEqual({ score: 8, rating: "Buy" })
  })

  it("parses JSON wrapped in markdown code block", () => {
    const input = '```json\n{"score": 7, "summary": "Good stock"}\n```'
    const result = parseAIJsonResponse(input)
    expect(result).toEqual({ score: 7, summary: "Good stock" })
  })

  it("parses JSON with surrounding text", () => {
    const input = 'Here is my analysis:\n{"score": 5}\nThank you.'
    const result = parseAIJsonResponse(input)
    expect(result).toEqual({ score: 5 })
  })

  it("throws on response with no JSON", () => {
    expect(() => parseAIJsonResponse("No JSON here")).toThrow(
      "No JSON found in AI response"
    )
  })

  it("throws on empty string", () => {
    expect(() => parseAIJsonResponse("")).toThrow(
      "No JSON found in AI response"
    )
  })

  it("throws on invalid JSON inside braces", () => {
    expect(() => parseAIJsonResponse("{not valid json}")).toThrow()
  })

  it("parses nested JSON objects", () => {
    const input = '{"factors": [{"name": "RSI", "score": 3}], "total": 7}'
    const result = parseAIJsonResponse(input)
    expect(result).toEqual({
      factors: [{ name: "RSI", score: 3 }],
      total: 7,
    })
  })

  it("handles response with multiple JSON objects (greedy match)", () => {
    const input = '{"a": 1, "b": 2}'
    const result = parseAIJsonResponse(input)
    expect(result).toHaveProperty("a")
    expect(result).toHaveProperty("b")
  })
})
