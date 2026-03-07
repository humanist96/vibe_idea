/**
 * US 테마 레지스트리
 * 정적 테마 정의: AI/반도체, EV, 빅테크, 클라우드, 배당귀족, 방산, 바이오, 핀테크
 */

export interface USTheme {
  readonly id: string
  readonly name: string
  readonly nameKr: string
  readonly description: string
  readonly symbols: readonly string[]
  readonly color: string
}

export const US_THEMES: readonly USTheme[] = [
  {
    id: "ai-semiconductor",
    name: "AI & Semiconductor",
    nameKr: "AI/반도체",
    description: "AI 인프라 및 반도체 핵심 기업",
    symbols: ["NVDA", "AMD", "AVGO", "INTC", "MU", "LRCX", "KLAC", "AMAT", "ARM", "MRVL", "SNPS", "CDNS", "QCOM", "TXN"],
    color: "#8b5cf6",
  },
  {
    id: "ev-clean-energy",
    name: "EV & Clean Energy",
    nameKr: "전기차/클린에너지",
    description: "전기차 및 친환경 에너지 관련 기업",
    symbols: ["TSLA", "NKE", "NEE", "LIN", "APD", "CAT", "DE"],
    color: "#10b981",
  },
  {
    id: "big-tech",
    name: "Big Tech (MAGNIFICENT 7)",
    nameKr: "빅테크 (매그니피센트7)",
    description: "미국 시가총액 상위 7대 기술주",
    symbols: ["AAPL", "MSFT", "GOOG", "AMZN", "NVDA", "META", "TSLA"],
    color: "#f59e0b",
  },
  {
    id: "cloud-saas",
    name: "Cloud & SaaS",
    nameKr: "클라우드/SaaS",
    description: "클라우드 인프라 및 SaaS 기업",
    symbols: ["MSFT", "AMZN", "GOOG", "CRM", "NOW", "ORCL", "ADBE", "PLTR"],
    color: "#3b82f6",
  },
  {
    id: "dividend-aristocrats",
    name: "Dividend Aristocrats",
    nameKr: "배당귀족",
    description: "25년 이상 연속 배당 인상 기업",
    symbols: ["JNJ", "PG", "KO", "PEP", "ABT", "MCD", "WMT", "CL", "SHW", "CAT", "XOM", "CVX"],
    color: "#ef4444",
  },
  {
    id: "defense",
    name: "Defense & Aerospace",
    nameKr: "방산/항공우주",
    description: "방위산업 및 항공우주 기업",
    symbols: ["LMT", "RTX", "BA", "GE", "HON", "UNP", "UPS"],
    color: "#64748b",
  },
  {
    id: "biotech-pharma",
    name: "Biotech & Pharma",
    nameKr: "바이오/제약",
    description: "바이오테크 및 대형 제약사",
    symbols: ["LLY", "UNH", "JNJ", "ABBV", "MRK", "TMO", "PFE", "ABT", "AMGN", "ISRG"],
    color: "#06b6d4",
  },
  {
    id: "fintech",
    name: "Fintech & Payments",
    nameKr: "핀테크/결제",
    description: "디지털 결제 및 핀테크 기업",
    symbols: ["V", "MA", "PYPL", "AXP", "GS", "MS", "BLK", "SCHW", "JPM"],
    color: "#ec4899",
  },
]

export function getUSThemeById(id: string): USTheme | undefined {
  return US_THEMES.find((t) => t.id === id)
}

export function getUSThemeSymbols(id: string): readonly string[] {
  return getUSThemeById(id)?.symbols ?? []
}
