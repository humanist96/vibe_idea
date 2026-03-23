/**
 * Batch parallel execution utility for AI analysis.
 * Runs items in batches of `batchSize` using Promise.allSettled,
 * respecting OpenAI rate limits while maximizing throughput.
 */

const DEFAULT_BATCH_SIZE = 5

export async function analyzeBatch<TItem, TResult>(
  items: readonly TItem[],
  fn: (item: TItem) => Promise<TResult>,
  fallbackFn: (item: TItem) => TResult,
  options?: {
    readonly batchSize?: number
    readonly onBatchComplete?: (completed: number, total: number) => void
  }
): Promise<TResult[]> {
  const batchSize = options?.batchSize ?? DEFAULT_BATCH_SIZE
  const results: TResult[] = []

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchResults = await Promise.allSettled(
      batch.map((item) => fn(item))
    )

    for (let j = 0; j < batchResults.length; j++) {
      const r = batchResults[j]
      results.push(
        r.status === "fulfilled" ? r.value : fallbackFn(batch[j])
      )
    }

    const completed = Math.min(i + batchSize, items.length)
    options?.onBatchComplete?.(completed, items.length)
  }

  return results
}
