export interface KrxStockEntry {
  readonly ticker: string
  readonly name: string
  readonly market: "KOSPI" | "KOSDAQ"
  readonly sector: string
  readonly price: number
  readonly change: number
  readonly changePercent: number
  readonly volume: number
  readonly marketCap: number
}

export interface KrxRawRow {
  readonly ISU_SRT_CD: string
  readonly ISU_ABBRV: string
  readonly MKT_NM: string
  readonly SECT_TP_NM?: string
  readonly TDD_CLSPRC: string
  readonly CMPPREVDD_PRC: string
  readonly FLUC_RT: string
  readonly ACC_TRDVOL: string
  readonly MKTCAP: string
}

export interface ScreenerParams {
  readonly page: number
  readonly limit: number
  readonly market: "ALL" | "KOSPI" | "KOSDAQ"
  readonly sector: string
  readonly sort: string
  readonly order: "asc" | "desc"
  readonly search: string
  readonly minPrice?: number
  readonly maxPrice?: number
  readonly minChangePercent?: number
  readonly maxChangePercent?: number
  readonly minMarketCap?: number
  readonly maxMarketCap?: number
}

export interface PaginatedResult<T> {
  readonly data: readonly T[]
  readonly meta: {
    readonly total: number
    readonly page: number
    readonly limit: number
    readonly totalPages: number
  }
}
