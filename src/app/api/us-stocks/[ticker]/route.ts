import { NextResponse, type NextRequest } from "next/server"
import { getUSQuote, getUSProfile, getUSMetrics } from "@/lib/api/finnhub"
import { getTwelveStatistics } from "@/lib/api/twelve-data"
import { getFmpProfile } from "@/lib/api/fmp"
import { findUSStock } from "@/lib/data/us-stock-registry"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await params
    const symbol = ticker.toUpperCase()

    const [quote, profile, metrics, stats, fmpProfile] = await Promise.allSettled([
      getUSQuote(symbol),
      getUSProfile(symbol),
      getUSMetrics(symbol),
      getTwelveStatistics(symbol),
      getFmpProfile(symbol),
    ])

    const quoteData = quote.status === "fulfilled" ? quote.value : null
    const profileData = profile.status === "fulfilled" ? profile.value : null
    const metricsData = metrics.status === "fulfilled" ? metrics.value : null
    const statsData = stats.status === "fulfilled" ? stats.value : null
    const fmpData = fmpProfile.status === "fulfilled" ? fmpProfile.value : null

    if (!quoteData || quoteData.c === 0) {
      return NextResponse.json(
        { success: false, error: "종목을 찾을 수 없습니다." },
        { status: 404 }
      )
    }

    const registry = findUSStock(symbol)

    return NextResponse.json({
      success: true,
      data: {
        symbol,
        name: profileData?.name ?? fmpData?.companyName ?? registry?.name ?? symbol,
        nameKr: registry?.nameKr ?? null,
        exchange: profileData?.exchange ?? fmpData?.exchange ?? registry?.exchange ?? "",
        sector: registry?.sector ?? fmpData?.sector ?? profileData?.finnhubIndustry ?? "",
        sectorKr: registry?.sectorKr ?? "",
        logo: profileData?.logo ?? fmpData?.image ?? null,
        weburl: profileData?.weburl ?? fmpData?.website ?? null,
        quote: {
          price: quoteData.c,
          change: quoteData.d,
          changePercent: quoteData.dp,
          open: quoteData.o,
          high: quoteData.h,
          low: quoteData.l,
          previousClose: quoteData.pc,
          timestamp: quoteData.t,
        },
        metrics: {
          marketCap: metricsData?.metric.marketCapitalization
            ? metricsData.metric.marketCapitalization * 1_000_000
            : fmpData?.marketCap
            ?? statsData?.statistics.valuations_metrics.market_capitalization ?? null,
          pe: metricsData?.metric.peAnnual
            ?? statsData?.statistics.valuations_metrics.trailing_pe ?? null,
          pb: metricsData?.metric.pbAnnual
            ?? statsData?.statistics.valuations_metrics.price_to_book_mrq ?? null,
          eps: metricsData?.metric.epsAnnual
            ?? statsData?.statistics.financials.diluted_eps_ttm ?? null,
          dividendYield: metricsData?.metric.dividendYieldIndicatedAnnual
            ?? (statsData?.statistics.dividends_and_splits.trailing_annual_dividend_yield
              ? statsData.statistics.dividends_and_splits.trailing_annual_dividend_yield * 100
              : null),
          beta: fmpData?.beta
            ?? metricsData?.metric.beta
            ?? statsData?.statistics.stock_statistics.beta ?? null,
          fiftyTwoWeekHigh: metricsData?.metric["52WeekHigh"]
            ?? statsData?.statistics.stock_statistics["52_week_high"] ?? null,
          fiftyTwoWeekLow: metricsData?.metric["52WeekLow"]
            ?? statsData?.statistics.stock_statistics["52_week_low"] ?? null,
          roe: statsData?.statistics.financials.return_on_equity_ttm ?? null,
          operatingMargin: statsData?.statistics.financials.operating_margin_ttm ?? null,
          revenueGrowth: statsData?.statistics.financials.quarterly_revenue_growth_yoy ?? null,
        },
        profile: {
          industry: fmpData?.industry ?? profileData?.finnhubIndustry ?? null,
          description: fmpData?.description ?? null,
          ceo: fmpData?.ceo ?? null,
          employees: fmpData?.fullTimeEmployees ?? null,
          headquarters: fmpData ? `${fmpData.city}, ${fmpData.state}` : null,
          ipoDate: fmpData?.ipoDate ?? profileData?.ipo ?? null,
          marketCap: fmpData?.marketCap ?? (profileData?.marketCapitalization ? profileData.marketCapitalization * 1_000_000 : null),
          shareOutstanding: profileData?.shareOutstanding ?? null,
        },
      },
    })
  } catch (error) {
    console.error("US Stock detail API error:", error)
    return NextResponse.json(
      { success: false, error: "미국 주식 데이터를 불러올 수 없습니다." },
      { status: 500 }
    )
  }
}
