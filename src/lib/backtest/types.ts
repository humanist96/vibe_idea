export type Operator = ">" | "<" | ">=" | "<=" | "crossAbove" | "crossBelow"

export type Indicator =
  | "RSI"
  | "MA"
  | "EMA"
  | "MACD"
  | "MACD_SIGNAL"
  | "BB_UPPER"
  | "BB_LOWER"
  | "PRICE"

export interface Condition {
  readonly indicator: Indicator
  readonly params: Readonly<Record<string, number>>
  readonly operator: Operator
  readonly value: number
}

export interface StrategyDefinition {
  readonly buyConditions: readonly Condition[]
  readonly sellConditions: readonly Condition[]
  readonly stopLoss?: number
  readonly takeProfit?: number
}

export interface TradeEntry {
  readonly date: string
  readonly type: "BUY" | "SELL"
  readonly price: number
  readonly shares: number
  readonly returnPct?: number
}

export interface BacktestResult {
  readonly totalReturn: number
  readonly cagr: number
  readonly mdd: number
  readonly sharpe: number
  readonly winRate: number
  readonly totalTrades: number
  readonly trades: readonly TradeEntry[]
  readonly equityCurve: readonly EquityPoint[]
}

export interface EquityPoint {
  readonly date: string
  readonly value: number
  readonly price: number
}

export interface OHLCVBar {
  readonly date: string
  readonly open: number
  readonly high: number
  readonly low: number
  readonly close: number
  readonly volume: number
}

export interface StrategyTemplate {
  readonly name: string
  readonly nameKr: string
  readonly description: string
  readonly definition: StrategyDefinition
}
