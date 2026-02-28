export interface DartDividendEntry {
  readonly rcept_no: string
  readonly corp_cls: string
  readonly corp_code: string
  readonly corp_name: string
  readonly se: string
  readonly stock_knd: string
  readonly thstrm: string
  readonly frmtrm: string
  readonly lwfr: string
}

export interface DividendInfo {
  readonly ticker: string
  readonly corpName: string
  readonly year: number
  readonly dividendPerShare: number
  readonly prevDividendPerShare: number
  readonly dividendYield: number
  readonly payoutRatio: number
  readonly dividendType: string
}
