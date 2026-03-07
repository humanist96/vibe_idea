/**
 * SEC API 클라이언트 (sec-api.io)
 * 미국 내부자 거래 (Form 4) 데이터 조회
 *
 * 무료 티어: 100 requests/day
 */

import { cache, ONE_HOUR } from "@/lib/cache/memory-cache"

const BASE_URL = "https://api.sec-api.io"

function getApiKey(): string {
  const key = process.env.SEC_API_KEY
  if (!key) throw new Error("SEC_API_KEY is not configured")
  return key
}

// ── Types ──────────────────────────────────────────────

interface SecInsiderCoding {
  readonly code: string // P=Purchase, S=Sale, A=Award, M=Exercise, etc.
}

interface SecInsiderAmounts {
  readonly shares: number | null
  readonly pricePerShare: number | null
  readonly acquiredDisposedCode: "A" | "D" | null
}

interface SecInsiderPostTransaction {
  readonly sharesOwnedFollowingTransaction: number | null
}

interface SecNonDerivativeTransaction {
  readonly securityTitle: string
  readonly transactionDate: string
  readonly coding: SecInsiderCoding
  readonly amounts: SecInsiderAmounts
  readonly postTransactionAmounts: SecInsiderPostTransaction
}

interface SecReportingOwner {
  readonly name: string
  readonly cik: string
  readonly relationship: {
    readonly isDirector: boolean
    readonly isOfficer: boolean
    readonly isTenPercentOwner: boolean
    readonly isOther: boolean
    readonly officerTitle?: string
  }
}

interface SecIssuer {
  readonly cik: string
  readonly name: string
  readonly tradingSymbol: string
}

interface SecInsiderFiling {
  readonly id: string
  readonly filedAt: string
  readonly issuer: SecIssuer
  readonly reportingOwner: SecReportingOwner
  readonly nonDerivativeTable?: {
    readonly transactions?: readonly SecNonDerivativeTransaction[]
  }
}

interface SecInsiderResponse {
  readonly total: { readonly value: number }
  readonly transactions: readonly SecInsiderFiling[]
}

// ── Exported types ──────────────────────────────────────

export interface InsiderTrade {
  readonly ownerName: string
  readonly ownerTitle: string
  readonly isDirector: boolean
  readonly isOfficer: boolean
  readonly isTenPercentOwner: boolean
  readonly transactionDate: string
  readonly filingDate: string
  readonly transactionCode: string
  readonly shares: number
  readonly pricePerShare: number | null
  readonly acquiredDisposed: "A" | "D" | null
  readonly sharesAfter: number | null
  readonly securityTitle: string
  readonly type: "buy" | "sell" | "other"
}

// ── API Functions ──────────────────────────────────────

export async function getInsiderTradings(
  symbol: string,
  size = 50
): Promise<readonly InsiderTrade[]> {
  const cacheKey = `sec-insider:${symbol}`
  const cached = cache.get<readonly InsiderTrade[]>(cacheKey)
  if (cached) return cached

  try {
    const res = await fetch(`${BASE_URL}/insider-trading`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: getApiKey(),
      },
      body: JSON.stringify({
        query: `issuer.tradingSymbol:${symbol}`,
        from: 0,
        size,
        sort: [{ filedAt: { order: "desc" } }],
      }),
    })

    if (!res.ok) {
      throw new Error(`SEC API insider-trading failed: ${res.status}`)
    }

    const data = (await res.json()) as SecInsiderResponse
    const trades: InsiderTrade[] = []

    for (const filing of data.transactions) {
      const owner = filing.reportingOwner
      const txns = filing.nonDerivativeTable?.transactions ?? []

      for (const txn of txns) {
        const code = txn.coding?.code ?? ""
        const type =
          code === "P" || code === "A"
            ? ("buy" as const)
            : code === "S" || code === "F"
              ? ("sell" as const)
              : ("other" as const)

        trades.push({
          ownerName: owner.name,
          ownerTitle: owner.relationship?.officerTitle ?? "",
          isDirector: owner.relationship?.isDirector ?? false,
          isOfficer: owner.relationship?.isOfficer ?? false,
          isTenPercentOwner: owner.relationship?.isTenPercentOwner ?? false,
          transactionDate: txn.transactionDate ?? "",
          filingDate: filing.filedAt?.slice(0, 10) ?? "",
          transactionCode: code,
          shares: txn.amounts?.shares ?? 0,
          pricePerShare: txn.amounts?.pricePerShare ?? null,
          acquiredDisposed: txn.amounts?.acquiredDisposedCode ?? null,
          sharesAfter:
            txn.postTransactionAmounts?.sharesOwnedFollowingTransaction ?? null,
          securityTitle: txn.securityTitle ?? "Common Stock",
          type,
        })
      }
    }

    cache.set(cacheKey, trades, ONE_HOUR)
    return trades
  } catch (error) {
    console.error(`SEC insider trading error for ${symbol}:`, error)
    return []
  }
}
