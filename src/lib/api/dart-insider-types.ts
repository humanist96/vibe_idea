/** Raw DART API response: 임원 지분 변동 (elestock.json) */
export interface ExecutiveStockEntry {
  readonly rcept_no: string
  readonly rcept_dt: string
  readonly corp_name: string
  readonly repror: string
  readonly isu_exctv_rgist_at: string
  readonly isu_exctv_ofcps: string
  readonly isu_main_shrholdr: string
  readonly sp_stock_lmp_cnt: string
  readonly sp_stock_lmp_irds_cnt: string
  readonly sp_stock_lmp_rate: string
  readonly sp_stock_lmp_irds_rate: string
}

/** Raw DART API response: 최대주주 변동 현황 (hyslrChgSttus.json) */
export interface MajorShareholderChange {
  readonly rcept_no: string
  readonly rcept_dt: string
  readonly corp_name: string
  readonly report_tp: string
  readonly repror: string
  readonly stkqy: string
  readonly stkqy_irds: string
  readonly stkrt: string
  readonly stkrt_irds: string
  readonly ctr_stkqy: string
  readonly ctr_stkrt: string
  readonly change_on: string
  readonly mxmm_shrholdr_nm: string
}

/** Normalized frontend type for insider activity display */
export interface InsiderActivity {
  readonly id: string
  readonly date: string
  readonly name: string
  readonly position: string
  readonly type: "buy" | "sell" | "other"
  readonly shares: number
  readonly totalShares: number
  readonly ratio: number
  readonly ratioChange: number
}
