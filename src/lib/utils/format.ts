export function formatNumber(value: number): string {
  return new Intl.NumberFormat("ko-KR").format(value)
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatPercent(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || isNaN(value)) return "--"
  const sign = value > 0 ? "+" : ""
  return `${sign}${value.toFixed(decimals)}%`
}

export function formatVolume(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return "--"
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`
  }
  return formatNumber(value)
}

export function formatMarketCap(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return "--"
  if (value >= 1_000_000_000_000) {
    return `${(value / 1_000_000_000_000).toFixed(1)}조`
  }
  if (value >= 100_000_000) {
    return `${(value / 100_000_000).toFixed(0)}억`
  }
  return formatNumber(value)
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d)
}
