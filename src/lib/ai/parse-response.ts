/**
 * Extract and parse JSON from an AI text response.
 * Handles markdown code blocks and surrounding text.
 */
export function parseAIJsonResponse(response: string): Record<string, unknown> {
  const cleaned = response
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim()

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error("No JSON found in AI response")
  }

  const parsed: unknown = JSON.parse(jsonMatch[0])
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("AI response is not a valid JSON object")
  }

  return parsed as Record<string, unknown>
}
