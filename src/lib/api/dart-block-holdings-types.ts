export interface DartMajorStockEntry {
  readonly rcept_no: string
  readonly rcept_dt: string
  readonly corp_cls: string
  readonly corp_code: string
  readonly corp_name: string
  readonly report_tp: string
  readonly repror: string
  readonly stkqy: string
  readonly stkqy_irds: string
  readonly stkrt: string
  readonly stkrt_irds: string
  readonly ctr_stkqy: string
  readonly ctr_stkrt: string
}

export interface BlockHolding {
  readonly ticker: string
  readonly corpName: string
  readonly reportDate: string
  readonly reportType: string
  readonly reporter: string
  readonly shares: number
  readonly sharesChange: number
  readonly ratio: number
  readonly ratioChange: number
  readonly totalShares: number
  readonly totalRatio: number
}
