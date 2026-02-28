import { z } from "zod"

export const FactorSchema = z.object({
  name: z.string(),
  impact: z.enum(["positive", "negative", "neutral"]),
  strength: z.number().min(1).max(5),
})

export const DataSourcesSchema = z.object({
  quote: z.boolean(),
  technical: z.boolean(),
  dart: z.boolean(),
  financials: z.boolean(),
  naverNews: z.boolean(),
  googleNews: z.boolean(),
})

export const AIScoreSchema = z.object({
  aiScore: z.number().min(1).max(10),
  rating: z.enum(["Strong Buy", "Buy", "Hold", "Sell", "Strong Sell"]),
  probability: z.number().min(0).max(100),
  technicalScore: z.number().min(1).max(10),
  fundamentalScore: z.number().min(1).max(10),
  sentimentScore: z.number().min(1).max(10),
  riskScore: z.number().min(1).max(10),
  factors: z.array(FactorSchema).min(3).max(15),
  summary: z.string(),
  keyInsight: z.string(),
  dataSources: DataSourcesSchema.optional(),
  newsHeadlines: z.array(z.string()).optional(),
  analyzedAt: z.string().optional(),
})

export type Factor = z.infer<typeof FactorSchema>
export type AIScore = z.infer<typeof AIScoreSchema>

export function getRatingFromScore(score: number): AIScore["rating"] {
  if (score >= 8.5) return "Strong Buy"
  if (score >= 7) return "Buy"
  if (score >= 4) return "Hold"
  if (score >= 2.5) return "Sell"
  return "Strong Sell"
}

export function getRatingColor(rating: AIScore["rating"]): string {
  switch (rating) {
    case "Strong Buy":
      return "text-green-600"
    case "Buy":
      return "text-green-500"
    case "Hold":
      return "text-yellow-600"
    case "Sell":
      return "text-red-500"
    case "Strong Sell":
      return "text-red-600"
  }
}

export function getRatingBadgeVariant(
  rating: AIScore["rating"]
): "green" | "yellow" | "red" {
  switch (rating) {
    case "Strong Buy":
    case "Buy":
      return "green"
    case "Hold":
      return "yellow"
    case "Sell":
    case "Strong Sell":
      return "red"
  }
}
