"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils/cn"
import { formatUSD, formatMarketCapUSD, formatPercent, formatLargeNumber } from "@/lib/utils/format"
import { PriceChange } from "@/components/ui/PriceChange"
import { Badge } from "@/components/ui/Badge"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { useUSWatchlistStore } from "@/store/us-watchlist"
import { Star, ExternalLink, TrendingUp, TrendingDown, Clock, Building2, Users, Calendar, MapPin } from "lucide-react"
import { FairValueCard } from "@/components/stock/FairValueCard"
import { EntryExitCoachCard } from "@/components/stock/EntryExitCoachCard"
import { USAIScorePanel } from "@/components/us-stocks/USAIScorePanel"
import { USEarningsPreviewCard } from "@/components/us-stocks/USEarningsPreviewCard"
import { USSimilarStocksCard } from "@/components/us-stocks/USSimilarStocksCard"
import { USDividendSustainabilityCard } from "@/components/us-stocks/USDividendSustainabilityCard"
import { USInsiderSentimentCard } from "@/components/us-stocks/USInsiderSentimentCard"

// ── Types ──────────────────────────────────────────────

interface USStockData {
  readonly symbol: string
  readonly name: string
  readonly nameKr: string | null
  readonly exchange: string
  readonly sector: string
  readonly sectorKr: string
  readonly logo: string | null
  readonly weburl: string | null
  readonly quote: {
    readonly price: number
    readonly change: number
    readonly changePercent: number
    readonly open: number
    readonly high: number
    readonly low: number
    readonly previousClose: number
    readonly timestamp: number
  }
  readonly metrics: {
    readonly marketCap: number | null
    readonly pe: number | null
    readonly pb: number | null
    readonly eps: number | null
    readonly dividendYield: number | null
    readonly beta: number | null
    readonly fiftyTwoWeekHigh: number | null
    readonly fiftyTwoWeekLow: number | null
    readonly roe: number | null
    readonly operatingMargin: number | null
    readonly revenueGrowth: number | null
  }
  readonly profile: {
    readonly industry: string | null
    readonly description: string | null
    readonly ceo: string | null
    readonly employees: string | null
    readonly headquarters: string | null
    readonly ipoDate: string | null
    readonly marketCap: number | null
    readonly shareOutstanding: number | null
  }
}

interface HistoricalPoint {
  readonly date: string
  readonly open: number
  readonly high: number
  readonly low: number
  readonly close: number
  readonly volume: number
}

interface NewsItem {
  readonly id: number
  readonly headline: string
  readonly summary: string
  readonly source: string
  readonly url: string
  readonly image: string
  readonly datetime: number
}

interface EarningsItem {
  readonly date: string
  readonly time: string
  readonly epsEstimate: number | null
  readonly epsActual: number | null
  readonly surprisePercent: number | null
}

// ── Component ──────────────────────────────────────────

const PERIODS = ["1W", "1M", "3M", "6M", "1Y"] as const

interface USStockDetailClientProps {
  readonly ticker: string
}

export function USStockDetailClient({ ticker }: USStockDetailClientProps) {
  const [stock, setStock] = useState<USStockData | null>(null)
  const [historical, setHistorical] = useState<HistoricalPoint[]>([])
  const [news, setNews] = useState<NewsItem[]>([])
  const [earnings, setEarnings] = useState<EarningsItem[]>([])
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>("1Y")
  const [loading, setLoading] = useState(true)

  const symbol = ticker.toUpperCase()

  // 관심종목 상태 (Zustand store)
  const { addTicker, removeTicker, isInWatchlist } = useUSWatchlistStore()
  const watchlisted = isInWatchlist(symbol)

  const toggleWatchlist = useCallback(() => {
    if (watchlisted) {
      removeTicker(symbol)
    } else {
      addTicker(symbol)
    }
  }, [symbol, watchlisted, addTicker, removeTicker])

  // 기본 데이터 fetch
  useEffect(() => {
    async function fetchAll() {
      try {
        const [stockRes, newsRes, earningsRes] = await Promise.allSettled([
          fetch(`/api/us-stocks/${symbol}`).then((r) => r.json()),
          fetch(`/api/us-stocks/${symbol}/news`).then((r) => r.json()),
          fetch(`/api/us-stocks/${symbol}/earnings`).then((r) => r.json()),
        ])

        if (stockRes.status === "fulfilled" && stockRes.value.success) {
          setStock(stockRes.value.data)
        }
        if (newsRes.status === "fulfilled" && newsRes.value.success) {
          setNews(newsRes.value.data)
        }
        if (earningsRes.status === "fulfilled" && earningsRes.value.success) {
          setEarnings(earningsRes.value.data)
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [symbol])

  // 차트 데이터 fetch
  useEffect(() => {
    async function fetchChart() {
      try {
        const res = await fetch(`/api/us-stocks/${symbol}/historical?period=${period}`)
        const json = await res.json()
        if (json.success) {
          setHistorical(json.data)
        }
      } catch {
        // silently fail
      }
    }
    fetchChart()
  }, [symbol, period])

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton className="h-20 w-full" />
        <LoadingSkeleton className="h-[400px] w-full" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    )
  }

  if (!stock) {
    return (
      <div className="py-20 text-center text-[var(--color-text-tertiary)]">
        종목 데이터를 불러올 수 없습니다.
      </div>
    )
  }

  const q = stock.quote

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between animate-fade-up">
        <div>
          <div className="flex items-center gap-3">
            {stock.logo && (
              <img
                src={stock.logo}
                alt={stock.name}
                className="h-10 w-10 rounded-xl object-contain bg-white p-1 ring-1 ring-slate-200"
              />
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">
                  {stock.nameKr ?? stock.name}
                </h1>
                <span className="font-mono text-sm text-[var(--color-text-muted)]">
                  {symbol}
                </span>
                <Badge variant="blue">{stock.exchange || "US"}</Badge>
                {stock.sectorKr && <Badge variant="gray">{stock.sectorKr}</Badge>}
              </div>
              {stock.nameKr && (
                <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{stock.name}</p>
              )}
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="font-display text-3xl font-bold tabular-nums text-[var(--color-text-primary)]">
              {formatUSD(q.price)}
            </span>
            <PriceChange change={q.change} changePercent={q.changePercent} className="text-lg" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {stock.weburl && (
            <a
              href={stock.weburl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl p-2.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-100)]"
              title="기업 홈페이지"
            >
              <ExternalLink className="h-5 w-5" />
            </a>
          )}
          <button
            type="button"
            onClick={toggleWatchlist}
            className="rounded-xl p-2.5 transition-colors hover:bg-[var(--color-surface-100)]"
            title={watchlisted ? "관심종목에서 제거" : "관심종목에 추가"}
          >
            <Star className={cn("h-6 w-6 transition-colors", watchlisted ? "fill-amber-400 text-amber-400" : "text-[var(--color-text-muted)]")} />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="glass-card p-5 animate-fade-up stagger-2">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--color-text-secondary)]">주가 차트</h2>
          <div className="flex gap-1">
            {PERIODS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={cn(
                  "rounded-lg px-3 py-1 text-xs font-medium transition-colors",
                  period === p
                    ? "bg-amber-100 text-amber-700"
                    : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-100)]"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <PriceChartSimple data={historical} />
      </div>

      {/* AI Score Panel */}
      <div className="animate-fade-up stagger-3">
        <USAIScorePanel ticker={symbol} />
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 animate-fade-up stagger-3">
        <MetricCard label="시가총액" value={formatMarketCapUSD(stock.metrics.marketCap)} />
        <MetricCard label="PER" value={stock.metrics.pe ? `${stock.metrics.pe.toFixed(1)}x` : "--"} />
        <MetricCard label="PBR" value={stock.metrics.pb ? `${stock.metrics.pb.toFixed(1)}x` : "--"} />
        <MetricCard label="EPS" value={stock.metrics.eps ? formatUSD(stock.metrics.eps) : "--"} />
        <MetricCard label="배당수익률" value={stock.metrics.dividendYield ? `${stock.metrics.dividendYield.toFixed(2)}%` : "--"} />
        <MetricCard label="베타" value={stock.metrics.beta ? stock.metrics.beta.toFixed(2) : "--"} />
        <MetricCard label="52주 최고" value={formatUSD(stock.metrics.fiftyTwoWeekHigh)} />
        <MetricCard label="52주 최저" value={formatUSD(stock.metrics.fiftyTwoWeekLow)} />
      </div>

      {/* AI 적정주가 + 매매 타이밍 코치 */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2 animate-fade-up">
        <FairValueCard
          ticker={symbol}
          name={stock.nameKr ?? stock.name}
          currentPrice={q.price}
          per={stock.metrics.pe}
          pbr={stock.metrics.pb}
          eps={stock.metrics.eps}
          dividendYield={stock.metrics.dividendYield}
          marketCap={stock.metrics.marketCap ?? undefined}
          sector={stock.sectorKr}
        />
        <EntryExitCoachCard
          ticker={symbol}
          name={stock.nameKr ?? stock.name}
          currentPrice={q.price}
          high52w={stock.metrics.fiftyTwoWeekHigh ?? undefined}
          low52w={stock.metrics.fiftyTwoWeekLow ?? undefined}
          per={stock.metrics.pe}
          pbr={stock.metrics.pb}
          changePercent={q.changePercent}
        />
      </div>

      {/* AI 실적 프리뷰 + 유사 종목 DNA + 배당 지속가능성 */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2 animate-fade-up">
        <USEarningsPreviewCard
          ticker={symbol}
          name={stock.nameKr ?? stock.name}
          recentPrice={q.price}
          changePercent={q.changePercent}
          sector={stock.sectorKr || stock.sector}
          earningsData={earnings.length > 0 ? {
            actualEps: earnings[0].epsActual,
            estimatedEps: earnings[0].epsEstimate,
            surprisePercent: earnings[0].surprisePercent,
            reportDate: earnings[0].date,
          } : undefined}
        />
        <USSimilarStocksCard
          ticker={symbol}
          name={stock.nameKr ?? stock.name}
          sector={stock.sectorKr || stock.sector}
          per={stock.metrics.pe}
          pbr={stock.metrics.pb}
          marketCap={stock.metrics.marketCap}
          dividendYield={stock.metrics.dividendYield}
          changePercent={q.changePercent}
        />
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2 animate-fade-up">
        <USDividendSustainabilityCard
          ticker={symbol}
          name={stock.nameKr ?? stock.name}
          currentPrice={q.price}
          dividendYield={stock.metrics.dividendYield}
          eps={stock.metrics.eps}
          sector={stock.sectorKr || stock.sector}
        />
        <USInsiderSentimentCard ticker={symbol} />
      </div>

      {/* Day Stats */}
      <div className="glass-card p-5 animate-fade-up stagger-4">
        <h3 className="mb-3 text-sm font-semibold text-[var(--color-text-secondary)]">오늘의 거래</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-[11px] text-[var(--color-text-muted)]">시가</p>
            <p className="font-mono text-sm font-semibold">{formatUSD(q.open)}</p>
          </div>
          <div>
            <p className="text-[11px] text-[var(--color-text-muted)]">고가</p>
            <p className="font-mono text-sm font-semibold text-[var(--color-gain)]">{formatUSD(q.high)}</p>
          </div>
          <div>
            <p className="text-[11px] text-[var(--color-text-muted)]">저가</p>
            <p className="font-mono text-sm font-semibold text-[var(--color-loss)]">{formatUSD(q.low)}</p>
          </div>
          <div>
            <p className="text-[11px] text-[var(--color-text-muted)]">전일 종가</p>
            <p className="font-mono text-sm font-semibold">{formatUSD(q.previousClose)}</p>
          </div>
        </div>
      </div>

      {/* Company Profile */}
      {stock.profile?.description && (
        <div className="glass-card p-5 animate-fade-up stagger-4">
          <h3 className="mb-3 text-sm font-semibold text-[var(--color-text-secondary)]">기업 개요</h3>
          <p className="mb-4 text-sm leading-relaxed text-[var(--color-text-secondary)] line-clamp-4">
            {stock.profile.description}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stock.profile.ceo && (
              <div className="flex items-start gap-2">
                <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-text-muted)]" />
                <div>
                  <p className="text-[10px] text-[var(--color-text-muted)]">CEO</p>
                  <p className="text-xs font-medium text-[var(--color-text-primary)]">{stock.profile.ceo}</p>
                </div>
              </div>
            )}
            {stock.profile.headquarters && (
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-text-muted)]" />
                <div>
                  <p className="text-[10px] text-[var(--color-text-muted)]">본사</p>
                  <p className="text-xs font-medium text-[var(--color-text-primary)]">{stock.profile.headquarters}</p>
                </div>
              </div>
            )}
            {stock.profile.employees && (
              <div className="flex items-start gap-2">
                <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-text-muted)]" />
                <div>
                  <p className="text-[10px] text-[var(--color-text-muted)]">직원 수</p>
                  <p className="text-xs font-medium text-[var(--color-text-primary)]">
                    {parseInt(stock.profile.employees).toLocaleString()}명
                  </p>
                </div>
              </div>
            )}
            {stock.profile.ipoDate && (
              <div className="flex items-start gap-2">
                <Calendar className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-text-muted)]" />
                <div>
                  <p className="text-[10px] text-[var(--color-text-muted)]">상장일</p>
                  <p className="text-xs font-medium text-[var(--color-text-primary)]">{stock.profile.ipoDate}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Additional Metrics */}
      {(stock.metrics.roe || stock.metrics.operatingMargin || stock.metrics.revenueGrowth) && (
        <div className="glass-card p-5 animate-fade-up">
          <h3 className="mb-3 text-sm font-semibold text-[var(--color-text-secondary)]">수익성 지표</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {stock.metrics.roe != null && (
              <div>
                <p className="text-[11px] text-[var(--color-text-muted)]">ROE</p>
                <p className="font-mono text-sm font-semibold">{(stock.metrics.roe * 100).toFixed(1)}%</p>
              </div>
            )}
            {stock.metrics.operatingMargin != null && (
              <div>
                <p className="text-[11px] text-[var(--color-text-muted)]">영업이익률</p>
                <p className="font-mono text-sm font-semibold">{(stock.metrics.operatingMargin * 100).toFixed(1)}%</p>
              </div>
            )}
            {stock.metrics.revenueGrowth != null && (
              <div>
                <p className="text-[11px] text-[var(--color-text-muted)]">매출 성장률 (YoY)</p>
                <p className="font-mono text-sm font-semibold">{formatPercent(stock.metrics.revenueGrowth * 100)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Earnings */}
      {earnings.length > 0 && (
        <div className="glass-card p-5 animate-fade-up">
          <h3 className="mb-3 text-sm font-semibold text-[var(--color-text-secondary)]">실적 히스토리</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="pb-2 text-left text-[11px] font-medium text-[var(--color-text-muted)]">날짜</th>
                  <th className="pb-2 text-right text-[11px] font-medium text-[var(--color-text-muted)]">EPS 추정</th>
                  <th className="pb-2 text-right text-[11px] font-medium text-[var(--color-text-muted)]">EPS 실제</th>
                  <th className="pb-2 text-right text-[11px] font-medium text-[var(--color-text-muted)]">서프라이즈</th>
                </tr>
              </thead>
              <tbody>
                {earnings.slice(0, 8).map((e) => (
                  <tr key={e.date} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="py-2 font-mono text-xs">{e.date}</td>
                    <td className="py-2 text-right font-mono text-xs">
                      {e.epsEstimate != null ? `$${e.epsEstimate.toFixed(2)}` : "--"}
                    </td>
                    <td className="py-2 text-right font-mono text-xs font-semibold">
                      {e.epsActual != null ? `$${e.epsActual.toFixed(2)}` : "--"}
                    </td>
                    <td className="py-2 text-right">
                      {e.surprisePercent != null ? (
                        <span className={cn(
                          "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                          e.surprisePercent > 0 ? "bg-emerald-50 text-emerald-700" : e.surprisePercent < 0 ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"
                        )}>
                          {e.surprisePercent > 0 ? <TrendingUp className="h-3 w-3" /> : e.surprisePercent < 0 ? <TrendingDown className="h-3 w-3" /> : null}
                          {e.surprisePercent > 0 ? "+" : ""}{e.surprisePercent.toFixed(1)}%
                        </span>
                      ) : "--"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* News */}
      {news.length > 0 && (
        <div className="glass-card p-5 animate-fade-up">
          <h3 className="mb-3 text-sm font-semibold text-[var(--color-text-secondary)]">관련 뉴스</h3>
          <div className="space-y-3">
            {news.slice(0, 8).map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl p-3 transition-colors hover:bg-[var(--color-surface-50)]"
              >
                <div className="flex items-start gap-3">
                  {item.image && (
                    <img
                      src={item.image}
                      alt=""
                      className="h-16 w-24 shrink-0 rounded-lg object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] line-clamp-2">
                      {item.headline}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-[var(--color-text-muted)]">
                      <span className="font-medium">{item.source}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(item.datetime)}
                      </span>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub Components ─────────────────────────────────────

function MetricCard({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="glass-card px-4 py-3">
      <p className="text-[11px] text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-0.5 font-mono text-sm font-semibold text-[var(--color-text-primary)]">
        {value}
      </p>
    </div>
  )
}

function PriceChartSimple({ data }: { readonly data: readonly HistoricalPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-[var(--color-text-muted)]">
        차트 데이터를 불러오는 중...
      </div>
    )
  }

  const prices = data.map((d) => d.close)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const range = max - min || 1
  const height = 300
  const width = 800

  const firstPrice = prices[0]
  const lastPrice = prices[prices.length - 1]
  const isPositive = lastPrice >= firstPrice

  const points = prices
    .map((p, i) => {
      const x = (i / (prices.length - 1)) * width
      const y = height - ((p - min) / range) * (height - 20) - 10
      return `${x},${y}`
    })
    .join(" ")

  const fillPoints = `0,${height} ${points} ${width},${height}`

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`gradient-${isPositive ? "up" : "down"}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity="0.2" />
            <stop offset="100%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          points={fillPoints}
          fill={`url(#gradient-${isPositive ? "up" : "down"})`}
        />
        <polyline
          points={points}
          fill="none"
          stroke={isPositive ? "#10b981" : "#ef4444"}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
      <div className="mt-2 flex justify-between text-[10px] text-[var(--color-text-muted)]">
        <span>{data[0].date}</span>
        <span>{data[data.length - 1].date}</span>
      </div>
    </div>
  )
}

function formatRelativeTime(unixSeconds: number): string {
  const now = Date.now() / 1000
  const diff = now - unixSeconds

  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`
  return new Date(unixSeconds * 1000).toLocaleDateString("ko-KR")
}
