export interface FredObservation {
  readonly date: string
  readonly value: string
}

export interface FredSeriesResponse {
  readonly observations: readonly FredObservation[]
}

export interface GlobalMacroIndicator {
  readonly name: string
  readonly nameKr: string
  readonly value: number
  readonly prevValue: number
  readonly change: number
  readonly changePercent: number
  readonly unit: string
  readonly date: string
  readonly history: readonly { readonly date: string; readonly value: number }[]
}
