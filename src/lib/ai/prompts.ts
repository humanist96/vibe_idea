import type { TechnicalIndicators } from "@/lib/analysis/technical"
import type { NewsSentiment } from "@/lib/api/news-types"
import type { CompanyOverview, FinancialStatement } from "@/lib/api/dart"

export interface PromptData {
  readonly name: string
  readonly ticker: string
  readonly price: number
  readonly changePercent: number
  readonly per: number | null
  readonly pbr: number | null
  readonly eps: number | null
  readonly dividendYield: number | null
  readonly marketCap: number
  readonly volume: number
  readonly technicalIndicators: TechnicalIndicators
  readonly sector: string
  readonly companyInfo?: CompanyOverview | null
  readonly financials?: readonly FinancialStatement[]
  readonly newsSentiment?: NewsSentiment | null
}

function formatAmount(amount: string | undefined): string {
  if (!amount) return "N/A"
  const num = Number(amount.replace(/,/g, ""))
  if (isNaN(num)) return "N/A"
  if (Math.abs(num) >= 1_0000_0000) {
    return `${(num / 1_0000_0000).toFixed(0)}억원`
  }
  if (Math.abs(num) >= 10000) {
    return `${(num / 10000).toFixed(0)}만원`
  }
  return `${num.toLocaleString()}원`
}

function buildCompanySection(info: CompanyOverview): string {
  return `
## 기업 정보 (DART 공시)
- 대표이사: ${info.ceo_nm}
- 설립일: ${info.est_dt ? `${info.est_dt.slice(0, 4)}년 ${info.est_dt.slice(4, 6)}월 ${info.est_dt.slice(6, 8)}일` : "N/A"}
- 업종코드: ${info.induty_code}
- 홈페이지: ${info.hm_url || "N/A"}
- 주소: ${info.adres}`
}

function buildFinancialsSection(
  financials: readonly FinancialStatement[]
): string {
  const findAccount = (name: string): FinancialStatement | undefined =>
    financials.find((f) => f.account_nm.includes(name))

  const revenue = findAccount("매출액") ?? findAccount("수익(매출액)")
  const operatingProfit = findAccount("영업이익")
  const netIncome = findAccount("당기순이익")
  const totalAssets = findAccount("자산총계")
  const totalLiabilities = findAccount("부채총계")
  const equity = findAccount("자본총계")

  const lines = ["", "## 재무제표 (최근 사업보고서)"]

  if (revenue) {
    lines.push(`- 매출액: ${formatAmount(revenue.thstrm_amount)} (전기: ${formatAmount(revenue.frmtrm_amount)})`)
  }
  if (operatingProfit) {
    lines.push(`- 영업이익: ${formatAmount(operatingProfit.thstrm_amount)} (전기: ${formatAmount(operatingProfit.frmtrm_amount)})`)
  }
  if (netIncome) {
    lines.push(`- 당기순이익: ${formatAmount(netIncome.thstrm_amount)} (전기: ${formatAmount(netIncome.frmtrm_amount)})`)
  }
  if (totalAssets) {
    lines.push(`- 자산총계: ${formatAmount(totalAssets.thstrm_amount)}`)
  }
  if (totalLiabilities) {
    lines.push(`- 부채총계: ${formatAmount(totalLiabilities.thstrm_amount)}`)
  }
  if (equity) {
    lines.push(`- 자본총계: ${formatAmount(equity.thstrm_amount)}`)
  }

  return lines.length > 2 ? lines.join("\n") : ""
}

function sanitizeForPrompt(text: string): string {
  return text
    .replace(/[\x00-\x1F\x7F]/g, " ")
    .slice(0, 200)
}

function buildNewsSentimentSection(sentiment: NewsSentiment): string {
  const lines = [
    "",
    "## 시장 심리 (최근 뉴스 분석)",
    `- 뉴스 감성: 긍정 ${sentiment.positiveCount}건 / 부정 ${sentiment.negativeCount}건 / 중립 ${sentiment.neutralCount}건`,
    `- 감성 점수: ${sentiment.overallScore}/10`,
  ]

  if (sentiment.keywords.length > 0) {
    lines.push(`- 주요 키워드: ${sentiment.keywords.join(", ")}`)
  }

  const topArticles = sentiment.articles.slice(0, 5)
  if (topArticles.length > 0) {
    lines.push("- 주요 헤드라인:")
    topArticles.forEach((article, i) => {
      lines.push(`  ${i + 1}. ${sanitizeForPrompt(article.title)} (${sanitizeForPrompt(article.source)})`)
    })
  }

  return lines.join("\n")
}

export function buildScoringPrompt(data: PromptData): string {
  let prompt = `당신은 한국 주식 시장 전문 AI 분석가입니다. 아래 데이터를 기반으로 종합적인 주식 분석을 수행하고, 정해진 JSON 형식으로만 응답하세요.

## 분석 대상
- 종목명: ${data.name} (${data.ticker})
- 현재가: ₩${data.price.toLocaleString()}
- 등락률: ${data.changePercent.toFixed(2)}%
- 섹터: ${data.sector}

## 재무 지표
- PER: ${data.per?.toFixed(2) ?? "N/A"}
- PBR: ${data.pbr?.toFixed(2) ?? "N/A"}
- EPS: ${data.eps?.toLocaleString() ?? "N/A"}
- 배당수익률: ${data.dividendYield?.toFixed(2) ?? "N/A"}%
- 시가총액: ₩${(data.marketCap / 100000000).toFixed(0)}억
- 거래량: ${data.volume.toLocaleString()}

## 기술적 지표
- RSI(14): ${data.technicalIndicators.rsi.toFixed(1)}
- MACD: ${data.technicalIndicators.macdLine.toFixed(2)} (Signal: ${data.technicalIndicators.macdSignal.toFixed(2)})
- MACD Histogram: ${data.technicalIndicators.macdHistogram.toFixed(2)}
- 20일 이동평균 대비: ${data.technicalIndicators.priceVsSma20.toFixed(2)}%
- 50일 이동평균 대비: ${data.technicalIndicators.priceVsSma50.toFixed(2)}%
- 200일 이동평균 대비: ${data.technicalIndicators.priceVsSma200.toFixed(2)}%
- 볼린저밴드: 상단 ${data.technicalIndicators.bollingerUpper.toFixed(0)} / 중간 ${data.technicalIndicators.bollingerMiddle.toFixed(0)} / 하단 ${data.technicalIndicators.bollingerLower.toFixed(0)}
- 거래량 비율(vs 20일 평균): ${data.technicalIndicators.volumeRatio.toFixed(2)}`

  // Conditional DART company info section
  if (data.companyInfo) {
    prompt += buildCompanySection(data.companyInfo)
  }

  // Conditional financials section
  if (data.financials && data.financials.length > 0) {
    const financialsSection = buildFinancialsSection(data.financials)
    if (financialsSection) {
      prompt += financialsSection
    }
  }

  // Conditional news sentiment section
  if (data.newsSentiment && data.newsSentiment.articles.length > 0) {
    prompt += buildNewsSentimentSection(data.newsSentiment)
  }

  prompt += `

## 응답 형식 (반드시 아래 JSON 형식으로만 응답)
{
  "aiScore": <1.0-10.0 종합점수>,
  "rating": "<Strong Buy|Buy|Hold|Sell|Strong Sell>",
  "probability": <0-100 시장대비 초과수익 확률>,
  "technicalScore": <1.0-10.0>,
  "fundamentalScore": <1.0-10.0>,
  "sentimentScore": <1.0-10.0>,
  "riskScore": <1.0-10.0 (높을수록 저위험)>,
  "factors": [
    {"name": "<한국어 요인 설명>", "impact": "<positive|negative|neutral>", "strength": <1-5>}
  ],
  "summary": "<한국어 3-5문장 분석 요약>",
  "keyInsight": "<한국어 핵심 인사이트 1문장>"
}

주의사항:
- 모든 텍스트는 한국어로 작성
- factors는 5-10개 사이로 제공
- JSON만 응답하고 다른 텍스트는 포함하지 마세요
- 기업정보, 재무제표, 뉴스 데이터가 제공된 경우 반드시 분석에 반영하세요`

  return prompt
}
