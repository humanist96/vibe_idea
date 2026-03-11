export const ALERT_TYPES = [
  "PRICE_ABOVE",
  "PRICE_BELOW",
  "VOLUME_SPIKE",
  "EARNINGS_DATE",
  "EX_DATE_D7",
  "DIVIDEND_CHANGE",
  "SAFETY_CHANGE",
  "GAP_MONTH",
] as const

export type AlertType = (typeof ALERT_TYPES)[number]

export const MARKETS = ["KR", "US"] as const
export type Market = (typeof MARKETS)[number]

export interface AlertRuleData {
  readonly id: string
  readonly userId: string
  readonly ticker: string
  readonly market: Market
  readonly type: AlertType
  readonly threshold: number | null
  readonly active: boolean
  readonly createdAt: string
  readonly updatedAt: string
}

export interface AlertNotificationData {
  readonly id: string
  readonly userId: string
  readonly ruleId: string | null
  readonly ticker: string | null
  readonly type: string
  readonly message: string
  readonly read: boolean
  readonly createdAt: string
}

export interface PriceData {
  readonly ticker: string
  readonly market: Market
  readonly currentPrice: number
  readonly previousClose: number
  readonly volume: number
  readonly averageVolume: number
}

export interface AlertCheckResult {
  readonly ruleId: string
  readonly userId: string
  readonly ticker: string
  readonly type: AlertType
  readonly message: string
  readonly triggered: boolean
}
