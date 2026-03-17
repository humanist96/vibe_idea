import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getQuote } from "@/lib/api/naver-finance"
import { getInvestorFlow } from "@/lib/api/naver-investor"
import {
  evaluateBreakoutResistance,
  evaluateBreakdownSupport,
  evaluateEarningsSurprise,
  evaluateForeignBulkBuy,
  evaluateInstitutionBulkBuy,
  isCooldownActive,
} from "@/lib/notifications/alert-checker"
import { COOLDOWN_MS } from "@/lib/notifications/types"
import type {
  AlertRuleData,
  PriceData,
  InvestorData,
  EarningsSurpriseData,
  Severity,
  AlertType,
} from "@/lib/notifications/types"

const ruleSchema = z.object({
  ruleId: z.string(),
  ticker: z.string(),
  market: z.enum(["KR", "US"]),
  type: z.enum([
    "BREAKOUT_RESISTANCE",
    "BREAKDOWN_SUPPORT",
    "EARNINGS_SURPRISE",
    "FOREIGN_BULK_BUY",
    "INSTITUTION_BULK_BUY",
  ]),
  threshold: z.number().nullable(),
  thresholdUnit: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  lastTriggeredAt: z.string().nullable().optional(),
})

const requestSchema = z.object({
  rules: z.array(ruleSchema),
})

interface TriggeredAlert {
  readonly ruleId: string
  readonly ticker: string
  readonly type: string
  readonly message: string
  readonly severity: Severity
  readonly metadata: Record<string, unknown>
}

function buildRuleData(rule: z.infer<typeof ruleSchema>): AlertRuleData {
  return {
    id: rule.ruleId,
    userId: "",
    ticker: rule.ticker,
    market: rule.market,
    type: rule.type as AlertType,
    threshold: rule.threshold,
    thresholdUnit: rule.thresholdUnit ?? null,
    notes: rule.notes ?? null,
    active: true,
    triggeredCount: 0,
    lastTriggeredAt: rule.lastTriggeredAt ?? null,
    createdAt: "",
    updatedAt: "",
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = requestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.message },
        { status: 400 }
      )
    }

    const { rules } = parsed.data

    if (rules.length === 0) {
      return NextResponse.json({ success: true, data: { triggered: [] } })
    }

    // Deduplicate tickers for data fetching
    const uniqueTickers = [...new Set(rules.map((r) => r.ticker))]

    // Fetch price data and investor data in parallel
    const [quoteResults, investorResults] = await Promise.all([
      Promise.allSettled(uniqueTickers.map((t) => getQuote(t))),
      Promise.allSettled(uniqueTickers.map((t) => getInvestorFlow(t, 1))),
    ])

    // Build price data map
    const priceMap = new Map<string, PriceData>()
    for (let i = 0; i < uniqueTickers.length; i++) {
      const result = quoteResults[i]
      if (result.status === "fulfilled" && result.value) {
        const q = result.value
        priceMap.set(uniqueTickers[i], {
          ticker: q.ticker,
          market: "KR",
          currentPrice: q.price,
          previousClose: q.previousClose,
          volume: q.volume,
          averageVolume: 0,
        })
      }
    }

    // Build investor data map
    const investorMap = new Map<string, InvestorData>()
    for (let i = 0; i < uniqueTickers.length; i++) {
      const result = investorResults[i]
      if (result.status === "fulfilled" && result.value) {
        const entries = result.value.entries
        if (entries.length > 0) {
          const latest = entries[0]
          investorMap.set(uniqueTickers[i], {
            foreignNet: latest.foreignNet,
            institutionNet: latest.institutionNet,
          })
        }
      }
    }

    const triggered: TriggeredAlert[] = []

    for (const rule of rules) {
      // Check cooldown
      if (isCooldownActive(rule.lastTriggeredAt ?? null, COOLDOWN_MS)) {
        continue
      }

      const ruleData = buildRuleData(rule)

      try {
        switch (rule.type) {
          case "BREAKOUT_RESISTANCE":
          case "BREAKDOWN_SUPPORT": {
            const price = priceMap.get(rule.ticker)
            if (!price) continue

            const result = rule.type === "BREAKOUT_RESISTANCE"
              ? evaluateBreakoutResistance(ruleData, price)
              : evaluateBreakdownSupport(ruleData, price)

            if (result.triggered) {
              triggered.push({
                ruleId: rule.ruleId,
                ticker: rule.ticker,
                type: rule.type,
                message: result.message,
                severity: result.severity,
                metadata: result.metadata,
              })
            }
            break
          }

          case "EARNINGS_SURPRISE": {
            // Earnings surprise requires actual vs consensus EPS
            // For now, skip if data unavailable (will be filled by earnings API)
            const earningsData: EarningsSurpriseData = {
              actualEps: null,
              consensusEps: null,
            }
            const result = evaluateEarningsSurprise(ruleData, earningsData)
            if (result.triggered) {
              triggered.push({
                ruleId: rule.ruleId,
                ticker: rule.ticker,
                type: rule.type,
                message: result.message,
                severity: result.severity,
                metadata: result.metadata,
              })
            }
            break
          }

          case "FOREIGN_BULK_BUY":
          case "INSTITUTION_BULK_BUY": {
            const investor = investorMap.get(rule.ticker)
            if (!investor) continue

            const result = rule.type === "FOREIGN_BULK_BUY"
              ? evaluateForeignBulkBuy(ruleData, investor)
              : evaluateInstitutionBulkBuy(ruleData, investor)

            if (result.triggered) {
              triggered.push({
                ruleId: rule.ruleId,
                ticker: rule.ticker,
                type: rule.type,
                message: result.message,
                severity: result.severity,
                metadata: result.metadata,
              })
            }
            break
          }
        }
      } catch (error) {
        // Skip individual rule evaluation on error (silent fail per design)
        console.error(`Alert check failed for rule ${rule.ruleId}:`, error)
      }
    }

    return NextResponse.json({ success: true, data: { triggered } })
  } catch (error) {
    console.error("Check advanced alerts error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to check advanced alerts" },
      { status: 500 }
    )
  }
}
