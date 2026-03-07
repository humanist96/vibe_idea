/**
 * 미국 주요 종목 레지스트리
 * S&P 500 시총 상위 + NASDAQ 100 주요 종목 (약 100개)
 * 섹터 분류, 한글명, 검색 기능
 */

export interface USStockEntry {
  readonly symbol: string
  readonly name: string
  readonly nameKr: string
  readonly sector: string
  readonly sectorKr: string
  readonly exchange: "NYSE" | "NASDAQ"
}

// GICS 섹터 한영 매핑
export const SECTOR_MAP: Readonly<Record<string, string>> = {
  Technology: "기술",
  Healthcare: "헬스케어",
  Financials: "금융",
  "Consumer Discretionary": "경기소비재",
  "Consumer Staples": "필수소비재",
  "Communication Services": "커뮤니케이션",
  Industrials: "산업재",
  Energy: "에너지",
  Utilities: "유틸리티",
  "Real Estate": "부동산",
  Materials: "소재",
}

export const US_SECTORS = Object.keys(SECTOR_MAP)

// 시총 상위 주요 종목 (약 100개)
const US_STOCKS: readonly USStockEntry[] = [
  // Technology
  { symbol: "AAPL", name: "Apple Inc.", nameKr: "애플", sector: "Technology", sectorKr: "기술", exchange: "NASDAQ" },
  { symbol: "MSFT", name: "Microsoft Corporation", nameKr: "마이크로소프트", sector: "Technology", sectorKr: "기술", exchange: "NASDAQ" },
  { symbol: "NVDA", name: "NVIDIA Corporation", nameKr: "엔비디아", sector: "Technology", sectorKr: "기술", exchange: "NASDAQ" },
  { symbol: "AVGO", name: "Broadcom Inc.", nameKr: "브로드컴", sector: "Technology", sectorKr: "기술", exchange: "NASDAQ" },
  { symbol: "ORCL", name: "Oracle Corporation", nameKr: "오라클", sector: "Technology", sectorKr: "기술", exchange: "NYSE" },
  { symbol: "CRM", name: "Salesforce Inc.", nameKr: "세일즈포스", sector: "Technology", sectorKr: "기술", exchange: "NYSE" },
  { symbol: "AMD", name: "Advanced Micro Devices", nameKr: "AMD", sector: "Technology", sectorKr: "기술", exchange: "NASDAQ" },
  { symbol: "ADBE", name: "Adobe Inc.", nameKr: "어도비", sector: "Technology", sectorKr: "기술", exchange: "NASDAQ" },
  { symbol: "INTC", name: "Intel Corporation", nameKr: "인텔", sector: "Technology", sectorKr: "기술", exchange: "NASDAQ" },
  { symbol: "CSCO", name: "Cisco Systems Inc.", nameKr: "시스코", sector: "Technology", sectorKr: "기술", exchange: "NASDAQ" },
  { symbol: "IBM", name: "International Business Machines", nameKr: "IBM", sector: "Technology", sectorKr: "기술", exchange: "NYSE" },
  { symbol: "QCOM", name: "Qualcomm Inc.", nameKr: "퀄컴", sector: "Technology", sectorKr: "기술", exchange: "NASDAQ" },
  { symbol: "TXN", name: "Texas Instruments", nameKr: "텍사스인스트루먼트", sector: "Technology", sectorKr: "기술", exchange: "NASDAQ" },
  { symbol: "NOW", name: "ServiceNow Inc.", nameKr: "서비스나우", sector: "Technology", sectorKr: "기술", exchange: "NYSE" },
  { symbol: "AMAT", name: "Applied Materials", nameKr: "어플라이드머티리얼즈", sector: "Technology", sectorKr: "기술", exchange: "NASDAQ" },
  { symbol: "MU", name: "Micron Technology", nameKr: "마이크론", sector: "Technology", sectorKr: "기술", exchange: "NASDAQ" },
  { symbol: "LRCX", name: "Lam Research", nameKr: "램리서치", sector: "Technology", sectorKr: "기술", exchange: "NASDAQ" },
  { symbol: "KLAC", name: "KLA Corporation", nameKr: "KLA", sector: "Technology", sectorKr: "기술", exchange: "NASDAQ" },
  { symbol: "SNPS", name: "Synopsys Inc.", nameKr: "시놉시스", sector: "Technology", sectorKr: "기술", exchange: "NASDAQ" },
  { symbol: "CDNS", name: "Cadence Design Systems", nameKr: "케이던스", sector: "Technology", sectorKr: "기술", exchange: "NASDAQ" },
  { symbol: "MRVL", name: "Marvell Technology", nameKr: "마벨", sector: "Technology", sectorKr: "기술", exchange: "NASDAQ" },
  { symbol: "ARM", name: "Arm Holdings", nameKr: "ARM", sector: "Technology", sectorKr: "기술", exchange: "NASDAQ" },
  { symbol: "PLTR", name: "Palantir Technologies", nameKr: "팔란티어", sector: "Technology", sectorKr: "기술", exchange: "NASDAQ" },

  // Communication Services
  { symbol: "GOOG", name: "Alphabet Inc.", nameKr: "알파벳(구글)", sector: "Communication Services", sectorKr: "커뮤니케이션", exchange: "NASDAQ" },
  { symbol: "META", name: "Meta Platforms Inc.", nameKr: "메타(페이스북)", sector: "Communication Services", sectorKr: "커뮤니케이션", exchange: "NASDAQ" },
  { symbol: "NFLX", name: "Netflix Inc.", nameKr: "넷플릭스", sector: "Communication Services", sectorKr: "커뮤니케이션", exchange: "NASDAQ" },
  { symbol: "DIS", name: "The Walt Disney Company", nameKr: "디즈니", sector: "Communication Services", sectorKr: "커뮤니케이션", exchange: "NYSE" },
  { symbol: "CMCSA", name: "Comcast Corporation", nameKr: "컴캐스트", sector: "Communication Services", sectorKr: "커뮤니케이션", exchange: "NASDAQ" },
  { symbol: "TMUS", name: "T-Mobile US Inc.", nameKr: "T-모바일", sector: "Communication Services", sectorKr: "커뮤니케이션", exchange: "NASDAQ" },

  // Consumer Discretionary
  { symbol: "AMZN", name: "Amazon.com Inc.", nameKr: "아마존", sector: "Consumer Discretionary", sectorKr: "경기소비재", exchange: "NASDAQ" },
  { symbol: "TSLA", name: "Tesla Inc.", nameKr: "테슬라", sector: "Consumer Discretionary", sectorKr: "경기소비재", exchange: "NASDAQ" },
  { symbol: "HD", name: "The Home Depot", nameKr: "홈디포", sector: "Consumer Discretionary", sectorKr: "경기소비재", exchange: "NYSE" },
  { symbol: "MCD", name: "McDonald's Corporation", nameKr: "맥도날드", sector: "Consumer Discretionary", sectorKr: "경기소비재", exchange: "NYSE" },
  { symbol: "NKE", name: "Nike Inc.", nameKr: "나이키", sector: "Consumer Discretionary", sectorKr: "경기소비재", exchange: "NYSE" },
  { symbol: "LOW", name: "Lowe's Companies", nameKr: "로우스", sector: "Consumer Discretionary", sectorKr: "경기소비재", exchange: "NYSE" },
  { symbol: "SBUX", name: "Starbucks Corporation", nameKr: "스타벅스", sector: "Consumer Discretionary", sectorKr: "경기소비재", exchange: "NASDAQ" },
  { symbol: "BKNG", name: "Booking Holdings", nameKr: "부킹홀딩스", sector: "Consumer Discretionary", sectorKr: "경기소비재", exchange: "NASDAQ" },
  { symbol: "TJX", name: "TJX Companies", nameKr: "TJX", sector: "Consumer Discretionary", sectorKr: "경기소비재", exchange: "NYSE" },
  { symbol: "ABNB", name: "Airbnb Inc.", nameKr: "에어비앤비", sector: "Consumer Discretionary", sectorKr: "경기소비재", exchange: "NASDAQ" },

  // Consumer Staples
  { symbol: "WMT", name: "Walmart Inc.", nameKr: "월마트", sector: "Consumer Staples", sectorKr: "필수소비재", exchange: "NYSE" },
  { symbol: "PG", name: "Procter & Gamble", nameKr: "P&G", sector: "Consumer Staples", sectorKr: "필수소비재", exchange: "NYSE" },
  { symbol: "COST", name: "Costco Wholesale", nameKr: "코스트코", sector: "Consumer Staples", sectorKr: "필수소비재", exchange: "NASDAQ" },
  { symbol: "KO", name: "The Coca-Cola Company", nameKr: "코카콜라", sector: "Consumer Staples", sectorKr: "필수소비재", exchange: "NYSE" },
  { symbol: "PEP", name: "PepsiCo Inc.", nameKr: "펩시코", sector: "Consumer Staples", sectorKr: "필수소비재", exchange: "NASDAQ" },
  { symbol: "PM", name: "Philip Morris International", nameKr: "필립모리스", sector: "Consumer Staples", sectorKr: "필수소비재", exchange: "NYSE" },
  { symbol: "CL", name: "Colgate-Palmolive", nameKr: "콜게이트팜올리브", sector: "Consumer Staples", sectorKr: "필수소비재", exchange: "NYSE" },

  // Financials
  { symbol: "BRK.B", name: "Berkshire Hathaway", nameKr: "버크셔해서웨이", sector: "Financials", sectorKr: "금융", exchange: "NYSE" },
  { symbol: "JPM", name: "JPMorgan Chase & Co.", nameKr: "JP모건", sector: "Financials", sectorKr: "금융", exchange: "NYSE" },
  { symbol: "V", name: "Visa Inc.", nameKr: "비자", sector: "Financials", sectorKr: "금융", exchange: "NYSE" },
  { symbol: "MA", name: "Mastercard Inc.", nameKr: "마스터카드", sector: "Financials", sectorKr: "금융", exchange: "NYSE" },
  { symbol: "BAC", name: "Bank of America", nameKr: "뱅크오브아메리카", sector: "Financials", sectorKr: "금융", exchange: "NYSE" },
  { symbol: "WFC", name: "Wells Fargo & Company", nameKr: "웰스파고", sector: "Financials", sectorKr: "금융", exchange: "NYSE" },
  { symbol: "GS", name: "Goldman Sachs Group", nameKr: "골드만삭스", sector: "Financials", sectorKr: "금융", exchange: "NYSE" },
  { symbol: "MS", name: "Morgan Stanley", nameKr: "모건스탠리", sector: "Financials", sectorKr: "금융", exchange: "NYSE" },
  { symbol: "AXP", name: "American Express", nameKr: "아메리칸익스프레스", sector: "Financials", sectorKr: "금융", exchange: "NYSE" },
  { symbol: "PYPL", name: "PayPal Holdings", nameKr: "페이팔", sector: "Financials", sectorKr: "금융", exchange: "NASDAQ" },
  { symbol: "BLK", name: "BlackRock Inc.", nameKr: "블랙록", sector: "Financials", sectorKr: "금융", exchange: "NYSE" },
  { symbol: "C", name: "Citigroup Inc.", nameKr: "씨티그룹", sector: "Financials", sectorKr: "금융", exchange: "NYSE" },
  { symbol: "SCHW", name: "Charles Schwab", nameKr: "찰스슈왑", sector: "Financials", sectorKr: "금융", exchange: "NYSE" },

  // Healthcare
  { symbol: "LLY", name: "Eli Lilly and Company", nameKr: "일라이릴리", sector: "Healthcare", sectorKr: "헬스케어", exchange: "NYSE" },
  { symbol: "UNH", name: "UnitedHealth Group", nameKr: "유나이티드헬스", sector: "Healthcare", sectorKr: "헬스케어", exchange: "NYSE" },
  { symbol: "JNJ", name: "Johnson & Johnson", nameKr: "존슨앤존슨", sector: "Healthcare", sectorKr: "헬스케어", exchange: "NYSE" },
  { symbol: "ABBV", name: "AbbVie Inc.", nameKr: "애브비", sector: "Healthcare", sectorKr: "헬스케어", exchange: "NYSE" },
  { symbol: "MRK", name: "Merck & Co.", nameKr: "머크", sector: "Healthcare", sectorKr: "헬스케어", exchange: "NYSE" },
  { symbol: "TMO", name: "Thermo Fisher Scientific", nameKr: "써모피셔", sector: "Healthcare", sectorKr: "헬스케어", exchange: "NYSE" },
  { symbol: "PFE", name: "Pfizer Inc.", nameKr: "화이자", sector: "Healthcare", sectorKr: "헬스케어", exchange: "NYSE" },
  { symbol: "ABT", name: "Abbott Laboratories", nameKr: "애보트", sector: "Healthcare", sectorKr: "헬스케어", exchange: "NYSE" },
  { symbol: "AMGN", name: "Amgen Inc.", nameKr: "암젠", sector: "Healthcare", sectorKr: "헬스케어", exchange: "NASDAQ" },
  { symbol: "ISRG", name: "Intuitive Surgical", nameKr: "인튜이티브서지컬", sector: "Healthcare", sectorKr: "헬스케어", exchange: "NASDAQ" },

  // Industrials
  { symbol: "GE", name: "GE Aerospace", nameKr: "GE에어로스페이스", sector: "Industrials", sectorKr: "산업재", exchange: "NYSE" },
  { symbol: "CAT", name: "Caterpillar Inc.", nameKr: "캐터필러", sector: "Industrials", sectorKr: "산업재", exchange: "NYSE" },
  { symbol: "UNP", name: "Union Pacific", nameKr: "유니온퍼시픽", sector: "Industrials", sectorKr: "산업재", exchange: "NYSE" },
  { symbol: "HON", name: "Honeywell International", nameKr: "허니웰", sector: "Industrials", sectorKr: "산업재", exchange: "NASDAQ" },
  { symbol: "RTX", name: "RTX Corporation", nameKr: "RTX(레이시온)", sector: "Industrials", sectorKr: "산업재", exchange: "NYSE" },
  { symbol: "BA", name: "The Boeing Company", nameKr: "보잉", sector: "Industrials", sectorKr: "산업재", exchange: "NYSE" },
  { symbol: "DE", name: "Deere & Company", nameKr: "디어", sector: "Industrials", sectorKr: "산업재", exchange: "NYSE" },
  { symbol: "LMT", name: "Lockheed Martin", nameKr: "록히드마틴", sector: "Industrials", sectorKr: "산업재", exchange: "NYSE" },
  { symbol: "UPS", name: "United Parcel Service", nameKr: "UPS", sector: "Industrials", sectorKr: "산업재", exchange: "NYSE" },

  // Energy
  { symbol: "XOM", name: "Exxon Mobil Corporation", nameKr: "엑슨모빌", sector: "Energy", sectorKr: "에너지", exchange: "NYSE" },
  { symbol: "CVX", name: "Chevron Corporation", nameKr: "셰브론", sector: "Energy", sectorKr: "에너지", exchange: "NYSE" },
  { symbol: "COP", name: "ConocoPhillips", nameKr: "코노코필립스", sector: "Energy", sectorKr: "에너지", exchange: "NYSE" },
  { symbol: "SLB", name: "Schlumberger Limited", nameKr: "슐럼버거", sector: "Energy", sectorKr: "에너지", exchange: "NYSE" },

  // Materials
  { symbol: "LIN", name: "Linde plc", nameKr: "린데", sector: "Materials", sectorKr: "소재", exchange: "NASDAQ" },
  { symbol: "APD", name: "Air Products and Chemicals", nameKr: "에어프로덕츠", sector: "Materials", sectorKr: "소재", exchange: "NYSE" },
  { symbol: "SHW", name: "Sherwin-Williams", nameKr: "셔윈윌리엄스", sector: "Materials", sectorKr: "소재", exchange: "NYSE" },
  { symbol: "FCX", name: "Freeport-McMoRan", nameKr: "프리포트맥모란", sector: "Materials", sectorKr: "소재", exchange: "NYSE" },
  { symbol: "NEM", name: "Newmont Corporation", nameKr: "뉴몬트", sector: "Materials", sectorKr: "소재", exchange: "NYSE" },

  // Utilities
  { symbol: "NEE", name: "NextEra Energy", nameKr: "넥스트에라에너지", sector: "Utilities", sectorKr: "유틸리티", exchange: "NYSE" },
  { symbol: "SO", name: "Southern Company", nameKr: "서던컴퍼니", sector: "Utilities", sectorKr: "유틸리티", exchange: "NYSE" },
  { symbol: "DUK", name: "Duke Energy", nameKr: "듀크에너지", sector: "Utilities", sectorKr: "유틸리티", exchange: "NYSE" },

  // Real Estate
  { symbol: "AMT", name: "American Tower", nameKr: "아메리칸타워", sector: "Real Estate", sectorKr: "부동산", exchange: "NYSE" },
  { symbol: "PLD", name: "Prologis Inc.", nameKr: "프롤로지스", sector: "Real Estate", sectorKr: "부동산", exchange: "NYSE" },
  { symbol: "EQIX", name: "Equinix Inc.", nameKr: "에퀴닉스", sector: "Real Estate", sectorKr: "부동산", exchange: "NASDAQ" },

  // Popular ETFs (for reference/search)
  { symbol: "SPY", name: "SPDR S&P 500 ETF", nameKr: "S&P500 ETF", sector: "ETF", sectorKr: "ETF", exchange: "NYSE" },
  { symbol: "QQQ", name: "Invesco QQQ Trust", nameKr: "나스닥100 ETF", sector: "ETF", sectorKr: "ETF", exchange: "NASDAQ" },
  { symbol: "IWM", name: "iShares Russell 2000 ETF", nameKr: "러셀2000 ETF", sector: "ETF", sectorKr: "ETF", exchange: "NYSE" },
  { symbol: "DIA", name: "SPDR Dow Jones ETF", nameKr: "다우존스 ETF", sector: "ETF", sectorKr: "ETF", exchange: "NYSE" },
  { symbol: "SOXX", name: "iShares Semiconductor ETF", nameKr: "반도체 ETF", sector: "ETF", sectorKr: "ETF", exchange: "NASDAQ" },
  { symbol: "ARKK", name: "ARK Innovation ETF", nameKr: "ARK 혁신 ETF", sector: "ETF", sectorKr: "ETF", exchange: "NYSE" },
]

// ── Index Maps ─────────────────────────────────────────

const symbolMap = new Map<string, USStockEntry>()
const nameSearchMap = new Map<string, USStockEntry>()

for (const stock of US_STOCKS) {
  symbolMap.set(stock.symbol, stock)
  nameSearchMap.set(stock.name.toLowerCase(), stock)
  nameSearchMap.set(stock.nameKr, stock)
}

// ── Public API ─────────────────────────────────────────

/** 심볼로 종목 조회 */
export function findUSStock(symbol: string): USStockEntry | undefined {
  return symbolMap.get(symbol.toUpperCase())
}

/** 종목 검색 (심볼, 영문명, 한글명) */
export function searchUSStocks(query: string, limit: number = 20): readonly USStockEntry[] {
  const q = query.toLowerCase().trim()
  if (!q) return []

  const results: USStockEntry[] = []
  const seen = new Set<string>()

  // 1. 심볼 정확 매치
  const exact = symbolMap.get(q.toUpperCase())
  if (exact) {
    results.push(exact)
    seen.add(exact.symbol)
  }

  // 2. 심볼 prefix 매치
  for (const stock of US_STOCKS) {
    if (seen.has(stock.symbol)) continue
    if (stock.symbol.toLowerCase().startsWith(q)) {
      results.push(stock)
      seen.add(stock.symbol)
    }
  }

  // 3. 이름 포함 매치
  for (const stock of US_STOCKS) {
    if (seen.has(stock.symbol)) continue
    if (
      stock.name.toLowerCase().includes(q) ||
      stock.nameKr.includes(q)
    ) {
      results.push(stock)
      seen.add(stock.symbol)
    }
  }

  return results.slice(0, limit)
}

/** 섹터별 종목 목록 */
export function getUSStocksBySector(sector: string): readonly USStockEntry[] {
  return US_STOCKS.filter((s) => s.sector === sector)
}

/** 전체 종목 목록 (ETF 제외) */
export function getAllUSStocks(): readonly USStockEntry[] {
  return US_STOCKS.filter((s) => s.sector !== "ETF")
}

/** 시총 상위 종목 (레지스트리 순서 기반) */
export function getTopUSStocks(count: number = 30): readonly USStockEntry[] {
  return US_STOCKS.filter((s) => s.sector !== "ETF").slice(0, count)
}

/** 인기 ETF 목록 */
export function getPopularETFs(): readonly USStockEntry[] {
  return US_STOCKS.filter((s) => s.sector === "ETF")
}

/** 주요 지수 심볼 */
export const US_INDEX_SYMBOLS = ["SPY", "QQQ", "DIA", "IWM"] as const

/** SPDR 섹터 ETF (섹터 로테이션용) */
export interface SectorETF {
  readonly symbol: string
  readonly name: string
  readonly nameKr: string
  readonly sector: string
  readonly sectorKr: string
}

export const US_SECTOR_ETFS: readonly SectorETF[] = [
  { symbol: "XLK", name: "Technology Select Sector SPDR", nameKr: "기술", sector: "Technology", sectorKr: "기술" },
  { symbol: "XLF", name: "Financial Select Sector SPDR", nameKr: "금융", sector: "Financials", sectorKr: "금융" },
  { symbol: "XLV", name: "Health Care Select Sector SPDR", nameKr: "헬스케어", sector: "Healthcare", sectorKr: "헬스케어" },
  { symbol: "XLY", name: "Consumer Discretionary Select Sector SPDR", nameKr: "경기소비재", sector: "Consumer Discretionary", sectorKr: "경기소비재" },
  { symbol: "XLP", name: "Consumer Staples Select Sector SPDR", nameKr: "필수소비재", sector: "Consumer Staples", sectorKr: "필수소비재" },
  { symbol: "XLC", name: "Communication Services Select Sector SPDR", nameKr: "커뮤니케이션", sector: "Communication Services", sectorKr: "커뮤니케이션" },
  { symbol: "XLI", name: "Industrial Select Sector SPDR", nameKr: "산업재", sector: "Industrials", sectorKr: "산업재" },
  { symbol: "XLE", name: "Energy Select Sector SPDR", nameKr: "에너지", sector: "Energy", sectorKr: "에너지" },
  { symbol: "XLU", name: "Utilities Select Sector SPDR", nameKr: "유틸리티", sector: "Utilities", sectorKr: "유틸리티" },
  { symbol: "XLRE", name: "Real Estate Select Sector SPDR", nameKr: "부동산", sector: "Real Estate", sectorKr: "부동산" },
  { symbol: "XLB", name: "Materials Select Sector SPDR", nameKr: "소재", sector: "Materials", sectorKr: "소재" },
]
