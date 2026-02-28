export type EventCategory =
  | "유상증자"
  | "무상증자"
  | "자사주"
  | "사채"
  | "합병분할"
  | "기타"

export interface DartDisclosureEntry {
  readonly corp_cls: string
  readonly corp_name: string
  readonly corp_code: string
  readonly stock_code: string
  readonly report_nm: string
  readonly rcept_no: string
  readonly flr_nm: string
  readonly rcept_dt: string
  readonly rm: string
}

export interface CorporateEvent {
  readonly id: string
  readonly date: string
  readonly corpName: string
  readonly stockCode: string
  readonly reportName: string
  readonly category: EventCategory
  readonly filer: string
  readonly rceptNo: string
}
