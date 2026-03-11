import type {
  AlertRuleData,
  PriceData,
  AlertCheckResult,
} from "./types"

function formatPrice(price: number, market: string): string {
  if (market === "US") {
    return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  return `${price.toLocaleString("ko-KR")}원`
}

function checkPriceAbove(
  rule: AlertRuleData,
  price: PriceData
): AlertCheckResult {
  const triggered =
    rule.threshold !== null && price.currentPrice >= rule.threshold

  return {
    ruleId: rule.id,
    userId: rule.userId,
    ticker: rule.ticker,
    type: "PRICE_ABOVE",
    message: `${rule.ticker} 현재가 ${formatPrice(price.currentPrice, rule.market)}이(가) 목표가 ${formatPrice(rule.threshold ?? 0, rule.market)}을(를) 돌파했습니다.`,
    triggered,
  }
}

function checkPriceBelow(
  rule: AlertRuleData,
  price: PriceData
): AlertCheckResult {
  const triggered =
    rule.threshold !== null && price.currentPrice <= rule.threshold

  return {
    ruleId: rule.id,
    userId: rule.userId,
    ticker: rule.ticker,
    type: "PRICE_BELOW",
    message: `${rule.ticker} 현재가 ${formatPrice(price.currentPrice, rule.market)}이(가) 하한가 ${formatPrice(rule.threshold ?? 0, rule.market)} 이하로 하락했습니다.`,
    triggered,
  }
}

function checkVolumeSpike(
  rule: AlertRuleData,
  price: PriceData
): AlertCheckResult {
  const multiplier = rule.threshold ?? 2
  const triggered =
    price.averageVolume > 0 &&
    price.volume >= price.averageVolume * multiplier

  return {
    ruleId: rule.id,
    userId: rule.userId,
    ticker: rule.ticker,
    type: "VOLUME_SPIKE",
    message: `${rule.ticker} 거래량이 평균 대비 ${Math.round(price.volume / price.averageVolume)}배 급증했습니다.`,
    triggered,
  }
}

function checkEarningsDate(
  rule: AlertRuleData,
  _price: PriceData
): AlertCheckResult {
  return {
    ruleId: rule.id,
    userId: rule.userId,
    ticker: rule.ticker,
    type: "EARNINGS_DATE",
    message: `${rule.ticker} 실적 발표일이 다가오고 있습니다.`,
    triggered: false,
  }
}

const checkers: Record<
  string,
  (rule: AlertRuleData, price: PriceData) => AlertCheckResult
> = {
  PRICE_ABOVE: checkPriceAbove,
  PRICE_BELOW: checkPriceBelow,
  VOLUME_SPIKE: checkVolumeSpike,
  EARNINGS_DATE: checkEarningsDate,
}

export function checkAlertRule(
  rule: AlertRuleData,
  price: PriceData
): AlertCheckResult {
  const checker = checkers[rule.type]
  if (!checker) {
    return {
      ruleId: rule.id,
      userId: rule.userId,
      ticker: rule.ticker,
      type: rule.type,
      message: `Unknown alert type: ${rule.type}`,
      triggered: false,
    }
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
        return {
          ruleId: rule.id,
          userId: rule.userId,
          ticker: rule.ticker,
          type: rule.type,
          message: `Price data unavailable for ${rule.ticker}`,
          triggered: false,
        }
      }
      return checkAlertRule(rule, price)
    })
    .filter((result) => result.triggered)
}
