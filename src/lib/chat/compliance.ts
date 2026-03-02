/**
 * 컴플라이언스 에이전트 — 한국 금융 규제 기반 자문/정보 경계 관리
 *
 * 자본시장법, 금융위 AI 7대 원칙에 따라
 * 투자 자문성 질문을 차단하고 교육 응답으로 전환한다.
 */

export type ComplianceResult =
  | { readonly blocked: false }
  | { readonly blocked: true; readonly redirect: string }

const ADVICE_PATTERNS: readonly RegExp[] = [
  // 직접 매매 추천
  /(?:사야|매수|매도|팔아야|팔까|살까|사도|샀|팔았|던지|물타기|추매|추가\s*매수)\s*(?:할까|할지|해도|하면|좋을까|될까|돼|해야|할까요|나요)/,
  /지금\s*(?:사|팔|매수|매도|들어가|나가)/,
  /(?:추천|추천해|골라|골라줘|찍어|뭘\s*사|뭐\s*살|어디\s*투자)/,

  // 목표가/적정가 요청
  /(?:목표가|적정가|적정\s*주가|타겟|얼마까지)\s*(?:알려|어디|얼마|뭐야|인가요)/,

  // 타이밍 조언
  /(?:저점|고점|바닥|천장|꼭대기)\s*(?:인가|일까|이야|맞아|찍었|인지)/,
  /(?:들어가|진입|매수)\s*(?:타이밍|시점|시기|때|적기)/,

  // 포트폴리오 구성 조언
  /(?:어떻게\s*구성|뭘\s*담아|종목\s*구성|비중|리밸런싱)\s*(?:하면|할까|좋을까|해야|추천)/,
  /(?:\d+만원|\d+억|\d+천만)\s*(?:으로|가지고)\s*(?:뭘|어디|어떤|어떻게)/,
]

const DISCLAIMER_SHORT =
  "본 정보는 투자 참고용이며 투자 권유가 아닙니다." as const

const DISCLAIMER_FULL =
  "본 정보는 투자 참고용이며 투자 권유가 아닙니다. AI 분석 결과는 과거 데이터와 공개 정보 기반이며, 미래 수익을 보장하지 않습니다. 투자 손실의 책임은 투자자 본인에게 있습니다." as const

export function checkCompliance(message: string): ComplianceResult {
  const normalized = message.replace(/\s+/g, " ").trim()

  for (const pattern of ADVICE_PATTERNS) {
    if (pattern.test(normalized)) {
      const redirect = buildRedirectMessage(normalized)
      return { blocked: true, redirect }
    }
  }

  return { blocked: false }
}

function buildRedirectMessage(message: string): string {
  if (/목표가|적정가|타겟|얼마까지/.test(message)) {
    return "투자 매매에 대한 직접적인 조언은 제공하지 않습니다. 대신 해당 종목의 증권사 컨센서스 목표가와 현재 밸류에이션 비교 데이터를 안내해 드리겠습니다."
  }
  if (/저점|고점|바닥|천장|타이밍|시점/.test(message)) {
    return "투자 매매에 대한 직접적인 조언은 제공하지 않습니다. 대신 최근 기술적 지표(RSI, MACD, 이동평균)와 거래량 추이를 보여드리겠습니다."
  }
  if (/어떻게\s*구성|비중|리밸런싱|뭘\s*담아/.test(message)) {
    return "포트폴리오 구성에 대한 직접적인 조언은 제공하지 않습니다. 대신 현재 시장 상위 종목과 섹터별 밸류에이션 데이터를 안내해 드리겠습니다."
  }
  if (/만원.*뭘|억.*어디|천만.*어떻게/.test(message)) {
    return "투자 매매에 대한 직접적인 조언은 제공하지 않습니다. 대신 현재 시장 상위 종목과 섹터별 밸류에이션 데이터를 안내해 드리겠습니다."
  }
  return "투자 매매에 대한 직접적인 조언은 제공하지 않습니다. 대신 해당 종목의 최근 실적, AI 분석 점수, 투자자 동향 등 객관적 데이터를 안내해 드리겠습니다."
}

export function getDisclaimer(isAIAnalysis: boolean): string {
  return isAIAnalysis ? DISCLAIMER_FULL : DISCLAIMER_SHORT
}
