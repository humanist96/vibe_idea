/**
 * Shared Korean Won formatting utilities for dividend-lab components
 */

export function formatWon(amount: number): string {
  if (amount >= 100_000_000) {
    return `${(amount / 100_000_000).toFixed(1)}억원`
  }
  if (amount >= 10_000) {
    return `${Math.round(amount / 10_000).toLocaleString()}만원`
  }
  return `${Math.round(amount).toLocaleString()}원`
}

export function formatWonShort(amount: number): string {
  if (amount >= 100_000_000) {
    return `${(amount / 100_000_000).toFixed(1)}억`
  }
  if (amount >= 10_000) {
    return `${Math.round(amount / 10_000).toLocaleString()}만`
  }
  return `${Math.round(amount).toLocaleString()}원`
}

export function formatWonAxis(value: number): string {
  if (value >= 100_000_000) return `${(value / 100_000_000).toFixed(0)}억`
  if (value >= 10_000) return `${Math.round(value / 10_000)}만`
  return `${value}`
}
