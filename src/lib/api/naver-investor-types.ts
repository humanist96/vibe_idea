export interface InvestorFlowEntry {
  readonly date: string
  readonly close: number
  readonly change: number
  readonly changePercent: number
  readonly volume: number
  readonly institutionNet: number
  readonly foreignNet: number
  readonly foreignHolding: number
  readonly foreignRatio: number
}

export interface InvestorFlow {
  readonly ticker: string
  readonly entries: readonly InvestorFlowEntry[]
}

export interface TopInvestorStock {
  readonly ticker: string
  readonly name: string
  readonly close: number
  readonly changePercent: number
  readonly foreignNet: number
  readonly institutionNet: number
  readonly foreignRatio: number
}
