export interface EcosStatRow {
  readonly STAT_CODE: string
  readonly STAT_NAME: string
  readonly ITEM_CODE1: string
  readonly ITEM_NAME1: string
  readonly TIME: string
  readonly DATA_VALUE: string
  readonly UNIT_NAME: string
}

export interface EcosApiResponse {
  readonly StatisticSearch?: {
    readonly list_total_count: number
    readonly row: readonly EcosStatRow[]
  }
}

export interface MacroIndicator {
  readonly name: string
  readonly nameEn: string
  readonly value: number
  readonly prevValue: number
  readonly change: number
  readonly changePercent: number
  readonly unit: string
  readonly date: string
  readonly history: readonly { readonly date: string; readonly value: number }[]
}
