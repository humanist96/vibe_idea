export const ALERT_TYPES = [
  "PRICE_ABOVE",
  "PRICE_BELOW",
  "VOLUME_SPIKE",
  "EARNINGS_DATE",
  "EX_DATE_D7",
  "DIVIDEND_CHANGE",
  "SAFETY_CHANGE",
  "GAP_MONTH",
  // 신규 알림 유형
  "BREAKOUT_RESISTANCE",
  "BREAKDOWN_SUPPORT",
  "EARNINGS_SURPRISE",
  "FOREIGN_BULK_BUY",
  "INSTITUTION_BULK_BUY",
] as const

export type AlertType = (typeof ALERT_TYPES)[number]

export const ADVANCED_ALERT_TYPES = [
  "BREAKOUT_RESISTANCE",
  "BREAKDOWN_SUPPORT",
  "EARNINGS_SURPRISE",
  "FOREIGN_BULK_BUY",
  "INSTITUTION_BULK_BUY",
] as const

export type AdvancedAlertType = (typeof ADVANCED_ALERT_TYPES)[number]

export const MARKETS = ["KR", "US"] as const
export type Market = (typeof MARKETS)[number]

export type Severity = "info" | "warning" | "critical"

export type NotificationType =
  | "price_surge"
  | "price_drop"
  | "market_alert"
  | "earnings_alert"
  | "breakout_resistance"
  | "breakdown_support"
  | "earnings_surprise"
  | "foreign_bulk_buy"
  | "institution_bulk_buy"

export interface AlertRuleData {
  readonly id: string
  readonly userId: string
  readonly ticker: string
  readonly market: Market
  readonly type: AlertType
  readonly threshold: number | null
  readonly thresholdUnit?: string | null
  readonly notes?: string | null
  readonly active: boolean
  readonly triggeredCount?: number
  readonly lastTriggeredAt?: string | null
  readonly createdAt: string
  readonly updatedAt: string
}

export interface AlertNotificationData {
  readonly id: string
  readonly userId: string
  readonly ruleId: string | null
  readonly ticker: string | null
  readonly stockName: string | null
  readonly type: string
  readonly message: string
  readonly severity: Severity
  readonly metadata: Record<string, unknown> | null
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

export interface InvestorData {
  readonly foreignNet: number
  readonly institutionNet: number
}

export interface EarningsSurpriseData {
  readonly actualEps: number | null
  readonly consensusEps: number | null
}

export interface AlertCheckResult {
  readonly ruleId: string
  readonly userId: string
  readonly ticker: string
  readonly type: AlertType
  readonly message: string
  readonly triggered: boolean
  readonly severity: Severity
  readonly metadata: Record<string, unknown>
}

export interface NotificationFilter {
  readonly type: NotificationType | "all"
  readonly severity: Severity | "all"
  readonly ticker: string | null
  readonly onlyUnread: boolean
}

export interface NotificationStats {
  readonly totalCount: number
  readonly byType: Partial<Record<NotificationType, number>>
  readonly bySeverity: Record<Severity, number>
  readonly topTickers: ReadonlyArray<{ readonly ticker: string; readonly count: number }>
  readonly dailyCounts: ReadonlyArray<{ readonly date: string; readonly count: number }>
  readonly hitRate: number
}

/** Cooldown duration in milliseconds (10 minutes) */
export const COOLDOWN_MS = 10 * 60 * 1000

/** Maximum notifications stored in Zustand */
export const MAX_NOTIFICATIONS = 100
