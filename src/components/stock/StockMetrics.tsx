import { Card } from "@/components/ui/Card"

interface MetricItem {
  readonly label: string
  readonly value: string | number | null
  readonly suffix?: string
}

interface StockMetricsProps {
  readonly per: number | null
  readonly pbr: number | null
  readonly eps: number | null
  readonly dividendYield: number | null
  readonly marketCap: number
  readonly volume: number
  readonly fiftyTwoWeekHigh: number
  readonly fiftyTwoWeekLow: number
}

function formatMetricValue(value: number | null, decimals = 2): string {
  if (value === null || value === undefined) return "--"
  return value.toFixed(decimals)
}

function formatLargeNumber(value: number): string {
  if (value >= 1_000_000_000_000) {
    return `${(value / 1_000_000_000_000).toFixed(1)}조`
  }
  if (value >= 100_000_000) {
    return `${(value / 100_000_000).toFixed(0)}억`
  }
  return value.toLocaleString("ko-KR")
}

export function StockMetrics({
  per,
  pbr,
  eps,
  dividendYield,
  marketCap,
  volume,
  fiftyTwoWeekHigh,
  fiftyTwoWeekLow,
}: StockMetricsProps) {
  const metrics: MetricItem[] = [
    { label: "PER", value: formatMetricValue(per), suffix: "배" },
    { label: "PBR", value: formatMetricValue(pbr), suffix: "배" },
    { label: "EPS", value: eps ? `${eps.toLocaleString("ko-KR")}` : "--" },
    {
      label: "배당률",
      value: dividendYield ? `${dividendYield.toFixed(2)}%` : "--",
    },
    { label: "시가총액", value: formatLargeNumber(marketCap) },
    { label: "거래량", value: volume.toLocaleString("ko-KR") },
    {
      label: "52주 최고",
      value: `${fiftyTwoWeekHigh.toLocaleString("ko-KR")}`,
    },
    {
      label: "52주 최저",
      value: `${fiftyTwoWeekLow.toLocaleString("ko-KR")}`,
    },
  ]

  return (
    <Card className="animate-fade-up stagger-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
              {metric.label}
            </p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-[var(--color-text-primary)]">
              {metric.value}
              {metric.suffix && metric.value !== "--" && (
                <span className="text-xs font-normal text-[var(--color-text-tertiary)]">
                  {" "}
                  {metric.suffix}
                </span>
              )}
            </p>
          </div>
        ))}
      </div>
    </Card>
  )
}
