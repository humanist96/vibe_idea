import type {
  BacktestResult,
  Condition,
  EquityPoint,
  OHLCVBar,
  StrategyDefinition,
  TradeEntry,
} from "./types"

interface IndicatorSeries {
  readonly rsi: readonly number[]
  readonly ma: ReadonlyMap<number, readonly number[]>
  readonly ema: ReadonlyMap<number, readonly number[]>
  readonly macd: readonly number[]
  readonly macdSignal: readonly number[]
  readonly bbUpper: readonly number[]
  readonly bbLower: readonly number[]
}

function computeSMA(closes: readonly number[], period: number): readonly number[] {
  const result: number[] = []
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      result.push(closes[i])
      continue
    }
    let sum = 0
    for (let j = i - period + 1; j <= i; j++) {
      sum += closes[j]
    }
    result.push(sum / period)
  }
  return result
}

function computeEMA(closes: readonly number[], period: number): readonly number[] {
  const result: number[] = []
  const k = 2 / (period + 1)
  for (let i = 0; i < closes.length; i++) {
    if (i === 0) {
      result.push(closes[0])
    } else {
      result.push(closes[i] * k + result[i - 1] * (1 - k))
    }
  }
  return result
}

function computeRSI(closes: readonly number[], period = 14): readonly number[] {
  const result: number[] = new Array(closes.length).fill(50)
  if (closes.length < period + 1) return result

  let avgGain = 0
  let avgLoss = 0
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1]
    if (diff > 0) avgGain += diff
    else avgLoss -= diff
  }
  avgGain /= period
  avgLoss /= period

  result[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1]
    const gain = diff > 0 ? diff : 0
    const loss = diff < 0 ? -diff : 0
    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period
    result[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)
  }
  return result
}

function computeMACD(
  closes: readonly number[]
): { readonly macd: readonly number[]; readonly signal: readonly number[] } {
  const ema12 = computeEMA(closes, 12)
  const ema26 = computeEMA(closes, 26)
  const macd = ema12.map((v, i) => v - ema26[i])
  const signal = computeEMA(macd, 9)
  return { macd, signal }
}

function computeBollingerBands(
  closes: readonly number[],
  period = 20
): { readonly upper: readonly number[]; readonly lower: readonly number[] } {
  const sma = computeSMA(closes, period)
  const upper: number[] = []
  const lower: number[] = []

  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      upper.push(closes[i])
      lower.push(closes[i])
      continue
    }
    let variance = 0
    for (let j = i - period + 1; j <= i; j++) {
      variance += (closes[j] - sma[i]) ** 2
    }
    const std = Math.sqrt(variance / period)
    upper.push(sma[i] + 2 * std)
    lower.push(sma[i] - 2 * std)
  }
  return { upper, lower }
}

function buildIndicators(closes: readonly number[]): IndicatorSeries {
  const rsi = computeRSI(closes)
  const { macd, signal: macdSignal } = computeMACD(closes)
  const { upper: bbUpper, lower: bbLower } = computeBollingerBands(closes)

  const maPeriods = [5, 10, 20, 50, 100, 200]
  const emaPeriods = [12, 26, 50]

  const maMap = new Map<number, readonly number[]>()
  for (const p of maPeriods) {
    maMap.set(p, computeSMA(closes, p))
  }

  const emaMap = new Map<number, readonly number[]>()
  for (const p of emaPeriods) {
    emaMap.set(p, computeEMA(closes, p))
  }

  return { rsi, ma: maMap, ema: emaMap, macd, macdSignal, bbUpper, bbLower }
}

function getIndicatorValue(
  condition: Condition,
  indicators: IndicatorSeries,
  closes: readonly number[],
  index: number
): number {
  const period = condition.params.period ?? 14

  switch (condition.indicator) {
    case "RSI":
      return indicators.rsi[index]
    case "MA": {
      const series = indicators.ma.get(period)
      return series ? series[index] : closes[index]
    }
    case "EMA": {
      const series = indicators.ema.get(period)
      return series ? series[index] : closes[index]
    }
    case "MACD":
      return indicators.macd[index]
    case "MACD_SIGNAL":
      return indicators.macdSignal[index]
    case "BB_UPPER":
      return indicators.bbUpper[index]
    case "BB_LOWER":
      return indicators.bbLower[index]
    case "PRICE":
      return closes[index]
    default:
      return closes[index]
  }
}

function evaluateCondition(
  condition: Condition,
  indicators: IndicatorSeries,
  closes: readonly number[],
  index: number
): boolean {
  const indicatorValue = getIndicatorValue(condition, indicators, closes, index)
  const target = condition.value

  switch (condition.operator) {
    case ">":
      return indicatorValue > target
    case "<":
      return indicatorValue < target
    case ">=":
      return indicatorValue >= target
    case "<=":
      return indicatorValue <= target
    case "crossAbove": {
      if (index === 0) return false
      const prev = getIndicatorValue(condition, indicators, closes, index - 1)
      return prev <= target && indicatorValue > target
    }
    case "crossBelow": {
      if (index === 0) return false
      const prev = getIndicatorValue(condition, indicators, closes, index - 1)
      return prev >= target && indicatorValue < target
    }
    default:
      return false
  }
}

function evaluateConditions(
  conditions: readonly Condition[],
  indicators: IndicatorSeries,
  closes: readonly number[],
  index: number
): boolean {
  return conditions.every((c) => evaluateCondition(c, indicators, closes, index))
}

interface RunBacktestOptions {
  readonly commissionRate?: number
  readonly initialCapital?: number
}

export function runBacktest(
  bars: readonly OHLCVBar[],
  strategy: StrategyDefinition,
  options: RunBacktestOptions = {}
): BacktestResult {
  const { commissionRate = 0.00015, initialCapital = 10_000_000 } = options
  const closes = bars.map((b) => b.close)
  const indicators = buildIndicators(closes)

  const trades: TradeEntry[] = []
  const equityCurve: EquityPoint[] = []
  let cash = initialCapital
  let shares = 0
  let entryPrice = 0
  let peakEquity = initialCapital

  const minIndex = Math.max(200, 26)

  for (let i = 0; i < bars.length; i++) {
    const price = closes[i]
    const equity = cash + shares * price

    if (i >= minIndex) {
      const inPosition = shares > 0

      if (!inPosition) {
        const shouldBuy = evaluateConditions(
          strategy.buyConditions,
          indicators,
          closes,
          i
        )
        if (shouldBuy) {
          const maxShares = Math.floor(cash / (price * (1 + commissionRate)))
          if (maxShares > 0) {
            const cost = maxShares * price * (1 + commissionRate)
            cash -= cost
            shares = maxShares
            entryPrice = price
            trades.push({
              date: bars[i].date,
              type: "BUY",
              price,
              shares: maxShares,
            })
          }
        }
      } else {
        const returnPct = ((price - entryPrice) / entryPrice) * 100
        const hitStopLoss =
          strategy.stopLoss !== undefined && returnPct <= strategy.stopLoss
        const hitTakeProfit =
          strategy.takeProfit !== undefined && returnPct >= strategy.takeProfit
        const shouldSell = evaluateConditions(
          strategy.sellConditions,
          indicators,
          closes,
          i
        )

        if (shouldSell || hitStopLoss || hitTakeProfit) {
          const proceeds = shares * price * (1 - commissionRate)
          cash += proceeds
          trades.push({
            date: bars[i].date,
            type: "SELL",
            price,
            shares,
            returnPct: Math.round(returnPct * 100) / 100,
          })
          shares = 0
          entryPrice = 0
        }
      }
    }

    const currentEquity = cash + shares * price
    peakEquity = Math.max(peakEquity, currentEquity)

    equityCurve.push({
      date: bars[i].date,
      value: Math.round(currentEquity),
      price,
    })
  }

  return computeMetrics(trades, equityCurve, initialCapital, bars.length)
}

function computeMetrics(
  trades: readonly TradeEntry[],
  equityCurve: readonly EquityPoint[],
  initialCapital: number,
  totalBars: number
): BacktestResult {
  const finalEquity = equityCurve.length > 0
    ? equityCurve[equityCurve.length - 1].value
    : initialCapital
  const totalReturn =
    Math.round(((finalEquity - initialCapital) / initialCapital) * 10000) / 100
  const years = totalBars / 252
  const cagr =
    years > 0
      ? Math.round(
          ((finalEquity / initialCapital) ** (1 / years) - 1) * 10000
        ) / 100
      : 0

  let peak = initialCapital
  let maxDrawdown = 0
  for (const point of equityCurve) {
    peak = Math.max(peak, point.value)
    const dd = (peak - point.value) / peak
    maxDrawdown = Math.max(maxDrawdown, dd)
  }
  const mdd = Math.round(maxDrawdown * 10000) / 100

  const sellTrades = trades.filter((t) => t.type === "SELL")
  const wins = sellTrades.filter((t) => (t.returnPct ?? 0) > 0).length
  const winRate =
    sellTrades.length > 0
      ? Math.round((wins / sellTrades.length) * 10000) / 100
      : 0

  const dailyReturns: number[] = []
  for (let i = 1; i < equityCurve.length; i++) {
    const prev = equityCurve[i - 1].value
    if (prev > 0) {
      dailyReturns.push((equityCurve[i].value - prev) / prev)
    }
  }
  const avgReturn =
    dailyReturns.length > 0
      ? dailyReturns.reduce((s, v) => s + v, 0) / dailyReturns.length
      : 0
  const stdReturn =
    dailyReturns.length > 1
      ? Math.sqrt(
          dailyReturns.reduce((s, v) => s + (v - avgReturn) ** 2, 0) /
            (dailyReturns.length - 1)
        )
      : 1
  const sharpe =
    stdReturn > 0
      ? Math.round((avgReturn / stdReturn) * Math.sqrt(252) * 100) / 100
      : 0

  return {
    totalReturn,
    cagr,
    mdd,
    sharpe,
    winRate,
    totalTrades: sellTrades.length,
    trades,
    equityCurve,
  }
}
