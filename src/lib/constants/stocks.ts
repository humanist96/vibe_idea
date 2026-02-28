export interface StockInfo {
  readonly ticker: string
  readonly name: string
  readonly market: "KOSPI" | "KOSDAQ"
  readonly sector: string
}

function kospi(ticker: string, name: string, sector: string): StockInfo {
  return { ticker, name, market: "KOSPI", sector }
}

function kosdaq(ticker: string, name: string, sector: string): StockInfo {
  return { ticker, name, market: "KOSDAQ", sector }
}

export const STOCK_LIST: readonly StockInfo[] = [
  // 반도체
  kospi("005930", "삼성전자", "반도체"),
  kospi("000660", "SK하이닉스", "반도체"),
  // IT/전자
  kospi("035420", "NAVER", "IT"),
  kospi("035720", "카카오", "IT"),
  kospi("259960", "크래프톤", "게임"),
  kospi("263750", "펄어비스", "게임"),
  kosdaq("293490", "카카오게임즈", "게임"),
  // 자동차
  kospi("005380", "현대차", "자동차"),
  kospi("000270", "기아", "자동차"),
  kospi("012330", "현대모비스", "자동차"),
  // 배터리/에너지
  kospi("373220", "LG에너지솔루션", "배터리"),
  kospi("006400", "삼성SDI", "배터리"),
  kosdaq("247540", "에코프로비엠", "배터리"),
  kosdaq("086520", "에코프로", "배터리"),
  // 바이오
  kospi("207940", "삼성바이오로직스", "바이오"),
  kospi("068270", "셀트리온", "바이오"),
  kosdaq("328130", "루닛", "바이오"),
  kosdaq("145020", "휴젤", "바이오"),
  // 금융
  kospi("055550", "신한지주", "금융"),
  kospi("105560", "KB금융", "금융"),
  kospi("086790", "하나금융지주", "금융"),
  kospi("316140", "우리금융지주", "금융"),
  // 철강/화학
  kospi("005490", "POSCO홀딩스", "철강"),
  kospi("051910", "LG화학", "화학"),
  kospi("009150", "삼성전기", "전자부품"),
  // 통신
  kospi("017670", "SK텔레콤", "통신"),
  kospi("030200", "KT", "통신"),
  kospi("032640", "LG유플러스", "통신"),
  // 유통/소비재
  kospi("034730", "SK", "지주"),
  kospi("003550", "LG", "지주"),
  kospi("018260", "삼성에스디에스", "IT서비스"),
  kospi("028260", "삼성물산", "건설/지주"),
  kospi("034220", "LG디스플레이", "디스플레이"),
  kospi("066570", "LG전자", "전자"),
  kospi("003670", "포스코퓨처엠", "소재"),
  kospi("010130", "고려아연", "비철금속"),
  kospi("036570", "엔씨소프트", "게임"),
  kospi("011200", "HMM", "해운"),
  kospi("009540", "HD한국조선해양", "조선"),
  kospi("329180", "HD현대중공업", "조선"),
  kospi("042700", "한미반도체", "반도체장비"),
  kospi("352820", "하이브", "엔터"),
  kospi("041510", "에스엠", "엔터"),
  kospi("122870", "와이지엔터테인먼트", "엔터"),
  kospi("016360", "삼성증권", "증권"),
  kospi("006800", "미래에셋증권", "증권"),
  kospi("000810", "삼성화재", "보험"),
  kospi("032830", "삼성생명", "보험"),
  kospi("010950", "S-Oil", "정유"),
  kospi("096770", "SK이노베이션", "정유"),
  // KOSDAQ 주요 종목
  kosdaq("196170", "알테오젠", "바이오"),
  kosdaq("403870", "HPSP", "반도체장비"),
  kosdaq("058470", "리노공업", "반도체장비"),
  kosdaq("041510", "에스엠", "엔터"),
  kosdaq("112040", "위메이드", "게임"),
  kosdaq("039030", "이오테크닉스", "반도체장비"),
  kosdaq("357780", "솔브레인", "화학"),
  kosdaq("095340", "ISC", "반도체장비"),
  kosdaq("068760", "셀트리온제약", "바이오"),
  kosdaq("099190", "아이센스", "의료기기"),
  kosdaq("036930", "주성엔지니어링", "반도체장비"),
  kosdaq("217190", "제너셈", "반도체장비"),
  kosdaq("067160", "아프리카TV", "미디어"),
  kosdaq("377300", "카카오페이", "핀테크"),
  kosdaq("323410", "카카오뱅크", "금융"),
  kosdaq("251270", "넷마블", "게임"),
  kosdaq("035900", "JYP Ent.", "엔터"),
  kosdaq("241560", "두산퓨얼셀", "에너지"),
  kosdaq("299900", "위즈코프", "IT"),
  kosdaq("078600", "대주전자재료", "소재"),
] as const

export const SECTORS = [
  "반도체", "IT", "게임", "자동차", "배터리", "바이오",
  "금융", "철강", "화학", "통신", "지주", "전자",
  "소재", "디스플레이", "조선", "엔터", "증권", "보험",
  "정유", "반도체장비", "핀테크", "에너지", "미디어",
  "IT서비스", "건설/지주", "비철금속", "해운", "전자부품", "의료기기",
] as const

export function findStock(ticker: string): StockInfo | undefined {
  return STOCK_LIST.find((s) => s.ticker === ticker)
}

export function searchStocks(query: string): StockInfo[] {
  const q = query.toLowerCase()
  return STOCK_LIST.filter(
    (s) =>
      s.ticker.includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.sector.toLowerCase().includes(q)
  )
}
