import type {
  AlertRuleData,
  PriceData,
  InvestorData,
  EarningsSurpriseData,
  AlertCheckResult,
  Severity,
} from "./types"

function formatPrice(price: number, market: string): string {
  if (market === "US") {
    return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  return `${price.toLocaleString("ko-KR")}원`
}

function makeResult(
  rule: AlertRuleData,
  triggered: boolean,
  message: string,
  severity: Severity = "info",
  metadata: Record<string, unknown> = {}
): AlertCheckResult {
  return {
    ruleId: rule.id,
    userId: rule.userId,
    ticker: rule.ticker,
    type: rule.type,
    message,
    triggered,
    severity,
    metadata,
  }
}

// ─── Existing checkers ──────────────────────────────────────

function checkPriceAbove(
  rule: AlertRuleData,
  price: PriceData
): AlertCheckResult {
  const triggered =
    rule.threshold !== null && price.currentPrice >= rule.threshold

  return makeResult(
    rule,
    triggered,
    `${rule.ticker} 현재가 ${formatPrice(price.currentPrice, rule.market)}이(가) 목표가 ${formatPrice(rule.threshold ?? 0, rule.market)}을(를) 돌파했습니다.`,
    "info",
    { currentPrice: price.currentPrice, threshold: rule.threshold }
  )
}

function checkPriceBelow(
  rule: AlertRuleData,
  price: PriceData
): AlertCheckResult {
  const triggered =
    rule.threshold !== null && price.currentPrice <= rule.threshold

  return makeResult(
    rule,
    triggered,
    `${rule.ticker} 현재가 ${formatPrice(price.currentPrice, rule.market)}이(가) 하한가 ${formatPrice(rule.threshold ?? 0, rule.market)} 이하로 하락했습니다.`,
    "warning",
    { currentPrice: price.currentPrice, threshold: rule.threshold }
  )
}

function checkVolumeSpike(
  rule: AlertRuleData,
  price: PriceData
): AlertCheckResult {
  const multiplier = rule.threshold ?? 2
  const triggered =
    price.averageVolume > 0 &&
    price.volume >= price.averageVolume * multiplier

  const ratio = price.averageVolume > 0
    ? Math.round(price.volume / price.averageVolume)
    : 0

  return makeResult(
    rule,
    triggered,
    `${rule.ticker} 거래량이 평균 대비 ${ratio}배 급증했습니다.`,
    "warning",
    { volume: price.volume, averageVolume: price.averageVolume, ratio }
  )
}

function checkEarningsDate(
  rule: AlertRuleData,
  _price: PriceData
): AlertCheckResult {
  return makeResult(
    rule,
    false,
    `${rule.ticker} 실적 발표일이 다가오고 있습니다.`,
    "info",
    {}
  )
}

// ─── New advanced checkers ──────────────────────────────────

export function evaluateBreakoutResistance(
  rule: AlertRuleData,
  price: PriceData
): AlertCheckResult {
  const threshold = rule.threshold ?? 0
  const triggered = threshold > 0 && price.currentPrice >= threshold

  return makeResult(
    rule,
    triggered,
    `${rule.ticker} 현재가 ${formatPrice(price.currentPrice, rule.market)}이(가) 저항선 ${formatPrice(threshold, rule.market)}을(를) 돌파했습니다.`,
    "critical",
    { currentPrice: price.currentPrice, resistanceLevel: threshold }
  )
}

export function evaluateBreakdownSupport(
  rule: AlertRuleData,
  price: PriceData
): AlertCheckResult {
  const threshold = rule.threshold ?? 0
  const triggered = threshold > 0 && price.currentPrice <= threshold

  return makeResult(
    rule,
    triggered,
    `${rule.ticker} 현재가 ${formatPrice(price.currentPrice, rule.market)}이(가) 지지선 ${formatPrice(threshold, rule.market)} 이하로 이탈했습니다.`,
    "critical",
    { currentPrice: price.currentPrice, supportLevel: threshold }
  )
}

export function evaluateEarningsSurprise(
  rule: AlertRuleData,
  earnings: EarningsSurpriseData
): AlertCheckResult {
  const thresholdPercent = rule.threshold ?? 10

  if (earnings.actualEps === null || earnings.consensusEps === null || earnings.consensusEps === 0) {
    return makeResult(
      rule,
      false,
      `${rule.ticker} 실적 데이터가 불충분합니다.`,
      "info",
      {}
    )
  }

  const surprisePercent =
    ((earnings.actualEps - earnings.consensusEps) / Math.abs(earnings.consensusEps)) * 100
  const triggered = Math.abs(surprisePercent) >= thresholdPercent

  const direction = surprisePercent > 0 ? "상회" : "하회"

  return makeResult(
    rule,
    triggered,
    `${rule.ticker} 실적 서프라이즈: 컨센서스 대비 ${direction} ${Math.abs(surprisePercent).toFixed(1)}%`,
    surprisePercent > 0 ? "info" : "critical",
    {
      actualEps: earnings.actualEps,
      consensusEps: earnings.consensusEps,
      surprisePercent,
    }
  )
}

export function evaluateForeignBulkBuy(
  rule: AlertRuleData,
  investor: InvestorData
): AlertCheckResult {
  const thresholdBillionKrw = rule.threshold ?? 50
  const foreignNetBillion = investor.foreignNet / 100_000_000
  const triggered = foreignNetBillion >= thresholdBillionKrw

  return makeResult(
    rule,
    triggered,
    `${rule.ticker} 외국인 순매수 ${foreignNetBillion.toFixed(0)}억원 (기준: ${thresholdBillionKrw}억원)`,
    triggered ? "warning" : "info",
    { foreignNet: investor.foreignNet, foreignNetBillion, threshold: thresholdBillionKrw }
  )
}

export function evaluateInstitutionBulkBuy(
  rule: AlertRuleData,
  investor: InvestorData
): AlertCheckResult {
  const thresholdBillionKrw = rule.threshold ?? 50
  const institutionNetBillion = investor.institutionNet / 100_000_000
  const triggered = institutionNetBillion >= thresholdBillionKrw

  return makeResult(
    rule,
    triggered,
    `${rule.ticker} 기관 순매수 ${institutionNetBillion.toFixed(0)}억원 (기준: ${thresholdBillionKrw}억원)`,
    triggered ? "warning" : "info",
    { institutionNet: investor.institutionNet, institutionNetBillion, threshold: thresholdBillionKrw }
  )
}

// ─── Cooldown check ─────────────────────────────────────────

export function isCooldownActive(
  lastTriggeredAt: string | null,
  cooldownMs: number
): boolean {
  if (!lastTriggeredAt) return false
  const lastTime = new Date(lastTriggeredAt).getTime()
  const now = Date.now()
  return now - lastTime < cooldownMs
}

// ─── Unified checker map ────────────────────────────────────

const priceCheckers: Record<
  string,
  (rule: AlertRuleData, price: PriceData) => AlertCheckResult
> = {
  PRICE_ABOVE: checkPriceAbove,
  PRICE_BELOW: checkPriceBelow,
  VOLUME_SPIKE: checkVolumeSpike,
  EARNINGS_DATE: checkEarningsDate,
  BREAKOUT_RESISTANCE: evaluateBreakoutResistance,
  BREAKDOWN_SUPPORT: evaluateBreakdownSupport,
}

export function checkAlertRule(
  rule: AlertRuleData,
  price: PriceData
): AlertCheckResult {
  const checker = priceCheckers[rule.type]
  if (!checker) {
    return makeResult(
      rule,
      false,
      `Unknown alert type: ${rule.type}`,
      "info",
      {}
    )
  }
  return checker(rule, price)
}

export function checkAlertRules(
  rules: readonly AlertRuleData[],
  prices: ReadonlyMap<string, PriceData>
): readonly AlertCheckResult[] {
  return rules
    .filter((rule) => rule.active)
    .map((rule) => {
      const key = `${rule.ticker}:${rule.market}`
      const price = prices.get(key)
      if (!price) {
        return makeResult(
          rule,
          false,
          `Price data unavailable for ${rule.ticker}`,
          "info",
          {}
        )
      }
      return checkAlertRule(rule, price)
    })
    .filter((result) => result.triggered)
}
