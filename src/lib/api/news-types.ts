export interface NewsArticle {
  readonly title: string
  readonly source: string
  readonly url: string
  readonly publishedAt: string
  readonly snippet?: string
}

export interface NewsSentiment {
  readonly articles: readonly NewsArticle[]
  readonly positiveCount: number
  readonly negativeCount: number
  readonly neutralCount: number
  readonly overallScore: number // 1-10
  readonly keywords: readonly string[]
}
