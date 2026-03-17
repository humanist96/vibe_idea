/**
 * 포트폴리오 분석 인텐트 — 타입 + 컨텍스트 빌더
 *
 * 보유 종목의 현재가, AI점수, 손익을 종합하여
 * 섹터/시장 배분까지 분석 컨텍스트를 생성한다.
 */

import type { PortfolioItem } from "@/store/portfolio"

// ── Types ──────────────────────────────────────────────────────

export interface PortfolioHoldingLive {
  readonly ticker: string
  readonly name: string
  readonly market: "KR" | "US"
  readonly sectorKr: string
  readonly quantity: number
  readonly avgPrice: number
  readonly currentPrice: number
  readonly unrealizedPnl: number
  readonly unrealizedPnlPct: number
  readonly aiScore: number | null
  readonly changePercent: number
}

export interface PortfolioAnalysisContext {
  readonly holdings: readonly PortfolioHoldingLive[]
  readonly totalValue: number
  readonly totalCost: number
  readonly totalPnl: number
  readonly totalPnlPct: number
  readonly sectorAllocation: readonly {
    readonly sector: string
    readonly weight: number
  }[]
  readonly marketAllocation: readonly {
    readonly market: "KR" | "US"
    readonly weight: number
  }[]
  readonly topGainer: PortfolioHoldingLive | null
  readonly topLoser: PortfolioHoldingLive | null
}

// ── Context Builder ────────────────────────────────────────────

/** 포트폴리오 분석 컨텍스트를 프롬프트용 문자열로 변환 */
export function buildPortfolioAnalysisContext(
  ctx: PortfolioAnalysisContext
): string {
  if (ctx.holdings.length === 0) {
    return "\n[포트폴리오가 비어 있습니다]\n포트폴리오에 종목을 추가하면 맞춤형 분석을 제공할 수 있습니다."
  }

  const lines: string[] = []

  // 총 요약
  const pnlSign = ctx.totalPnl >= 0 ? "+" : ""
  lines.push("[포트폴리오 분석 현황]")
  lines.push(
    `총 평가금액: ${ctx.totalValue.toLocaleString()}원 | 총 투자금액: ${ctx.totalCost.toLocaleString()}원`
  )
  lines.push(
    `총 손익: ${pnlSign}${ctx.totalPnl.toLocaleString()}원 (${pnlSign}${ctx.totalPnlPct.toFixed(2)}%)`
  )

  // 보유 종목
  lines.push("")
  lines.push("[보유 종목]")
  for (const h of ctx.holdings) {
    const pSign = h.unrealizedPnl >= 0 ? "+" : ""
    const cSign = h.changePercent >= 0 ? "+" : ""
    const scoreStr = h.aiScore != null ? ` | AI점수: ${h.aiScore}` : ""
    lines.push(
      `• ${h.name}(${h.ticker}): ${h.currentPrice.toLocaleString()}원 (${cSign}${h.changePercent.toFixed(2)}%) | 수량: ${h.quantity} | 평단: ${h.avgPrice.toLocaleString()} | 손익: ${pSign}${h.unrealizedPnl.toLocaleString()}원(${pSign}${h.unrealizedPnlPct.toFixed(2)}%)${scoreStr}`
    )
  }

  // 섹터 배분
  if (ctx.sectorAllocation.length > 0) {
    lines.push("")
    lines.push("[섹터 배분]")
    const sectorStr = ctx.sectorAllocation
      .map((s) => `${s.sector}: ${s.weight.toFixed(1)}%`)
      .join(" | ")
    lines.push(sectorStr)
  }

  // 시장 배분
  if (ctx.marketAllocation.length > 0) {
    lines.push("")
    lines.push("[시장 배분]")
    const marketStr = ctx.marketAllocation
      .map((m) => `${m.market}: ${m.weight.toFixed(1)}%`)
      .join(" | ")
    lines.push(marketStr)
  }

  // TOP/BOTTOM
  if (ctx.topGainer) {
    lines.push("")
    lines.push(
      `[최고 수익 종목] ${ctx.topGainer.name}: +${ctx.topGainer.unrealizedPnlPct.toFixed(2)}%`
    )
  }
  if (ctx.topLoser) {
    lines.push(
      `[최저 수익 종목] ${ctx.topLoser.name}: ${ctx.topLoser.unrealizedPnlPct.toFixed(2)}%`
    )
  }

  return "\n" + lines.join("\n")
}

// ── Data Builder ───────────────────────────────────────────────

/** 포트폴리오 아이템 + 실시간 가격으로 분석 컨텍스트 구성 */
export function assemblePortfolioContext(
  items: readonly PortfolioItem[],
  priceMap: ReadonlyMap<string, { readonly price: number; readonly changePercent: number }>,
  aiScoreMap: ReadonlyMap<string, number | null>
): PortfolioAnalysisContext {
  const holdings: PortfolioHoldingLive[] = items.map((item) => {
    const priceData = priceMap.get(item.ticker)
    const currentPrice = priceData?.price ?? 0
    const changePercent = priceData?.changePercent ?? 0
    const unrealizedPnl = (currentPrice - item.avgPrice) * item.quantity
    const unrealizedPnlPct =
      item.avgPrice > 0
        ? ((currentPrice - item.avgPrice) / item.avgPrice) * 100
        : 0

    return {
      ticker: item.ticker,
      name: item.name,
      market: item.market,
      sectorKr: item.sectorKr,
      quantity: item.quantity,
      avgPrice: item.avgPrice,
      currentPrice,
      unrealizedPnl,
      unrealizedPnlPct,
      aiScore: aiScoreMap.get(item.ticker) ?? null,
      changePercent,
    }
  })

  const totalValue = holdings.reduce(
    (sum, h) => sum + h.currentPrice * h.quantity,
    0
  )
  const totalCost = holdings.reduce(
    (sum, h) => sum + h.avgPrice * h.quantity,
    0
  )
  const totalPnl = totalValue - totalCost
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0

  // 섹터 배분
  const sectorMap = new Map<string, number>()
  for (const h of holdings) {
    const value = h.currentPrice * h.quantity
    sectorMap.set(h.sectorKr, (sectorMap.get(h.sectorKr) ?? 0) + value)
  }
  const sectorAllocation = [...sectorMap.entries()]
    .map(([sector, value]) => ({
      sector,
      weight: totalValue > 0 ? (value / totalValue) * 100 : 0,
    }))
    .sort((a, b) => b.weight - a.weight)

  // 시장 배분
  const marketMap = new Map<"KR" | "US", number>()
  for (const h of holdings) {
    const value = h.currentPrice * h.quantity
    marketMap.set(h.market, (marketMap.get(h.market) ?? 0) + value)
  }
  const marketAllocation = ([...marketMap.entries()] as readonly ["KR" | "US", number][])
    .map(([market, value]) => ({
      market,
      weight: totalValue > 0 ? (value / totalValue) * 100 : 0,
    }))
    .sort((a, b) => b.weight - a.weight)

  // TOP gainer / loser
  const sorted = [...holdings].sort(
    (a, b) => b.unrealizedPnlPct - a.unrealizedPnlPct
  )
  const topGainer = sorted.length > 0 ? sorted[0] : null
  const topLoser = sorted.length > 0 ? sorted[sorted.length - 1] : null

  return {
    holdings,
    totalValue,
    totalCost,
    totalPnl,
    totalPnlPct,
    sectorAllocation,
    marketAllocation,
    topGainer,
    topLoser,
  }
}
