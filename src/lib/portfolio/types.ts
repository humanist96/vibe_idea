export interface PortfolioItemLive {
  readonly ticker: string
  readonly market: "KR" | "US"
  readonly name: string
  readonly sectorKr: string
  readonly quantity: number
  readonly avgPrice: number
  readonly currentPrice: number
  readonly unrealizedPnl: number
  readonly unrealizedPnlPct: number
}

export interface PortfolioSummary {
  readonly totalValue: number
  readonly totalCost: number
  readonly totalPnl: number
  readonly totalPnlPct: number
  readonly dailyPnl: number
  readonly dailyPnlPct: number
}

export interface TransactionRecord {
  readonly id: string
  readonly ticker: string
  readonly market: "KR" | "US"
  readonly type: "BUY" | "SELL"
  readonly quantity: number
  readonly price: number
  readonly fee: number
  readonly date: string
  readonly note?: string
  readonly createdAt: string
}

export interface DividendRecordItem {
  readonly id: string
  readonly ticker: string
  readonly market: "KR" | "US"
  readonly amount: number
  readonly currency: "KRW" | "USD"
  readonly receivedAt: string
  readonly createdAt: string
}

export interface AllocationSlice {
  readonly name: string
  readonly value: number
  readonly percentage: number
}
