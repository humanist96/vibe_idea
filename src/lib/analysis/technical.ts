export interface TechnicalIndicators {
  readonly rsi: number
  readonly macdLine: number
  readonly macdSignal: number
  readonly macdHistogram: number
  readonly sma20: number
  readonly sma50: number
  readonly sma200: number
  readonly ema12: number
  readonly ema26: number
  readonly bollingerUpper: number
  readonly bollingerMiddle: number
  readonly bollingerLower: number
  readonly atr: number
  readonly priceVsSma20: number
  readonly priceVsSma50: number
  readonly priceVsSma200: number
  readonly volumeRatio: number
}

interface OHLCV {
  readonly close: number
  readonly high: number
  readonly low: number
  readonly volume: number
}

function sma(values: number[], period: number): number {
  if (values.length < period) return values[values.length - 1] ?? 0
  const slice = values.slice(-period)
  return slice.reduce((sum, v) => sum + v, 0) / period
}

function ema(values: number[], period: number): number {
  if (values.length === 0) return 0
  const k = 2 / (period + 1)
  let result = values[0]
  for (let i = 1; i < values.length; i++) {
    result = values[i] * k + result * (1 - k)
  }
  return result
}

function calculateRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50

  let gains = 0
  let losses = 0

  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1]
    if (diff > 0) gains += diff
    else losses -= diff
  }

  const avgGain = gains / period
  const avgLoss = losses / period

  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - 100 / (1 + rs)
}

function calculateATR(data: OHLCV[], period = 14): number {
  if (data.length < period + 1) return 0

  const trs: number[] = []
  for (let i = 1; i < data.length; i++) {
    const tr = Math.max(
      data[i].high - data[i].low,
      Math.abs(data[i].high - data[i - 1].close),
      Math.abs(data[i].low - data[i - 1].close)
    )
    trs.push(tr)
  }

  return sma(trs, period)
}

export function calculateTechnicalIndicators(
  data: OHLCV[]
): TechnicalIndicators {
  const closes = data.map((d) => d.close)
  const volumes = data.map((d) => d.volume)
  const currentPrice = closes[closes.length - 1] ?? 0

  const rsi = calculateRSI(closes)
  const ema12Val = ema(closes, 12)
  const ema26Val = ema(closes, 26)
  const macdLine = ema12Val - ema26Val

  const macdValues: number[] = []
  for (let i = 26; i <= closes.length; i++) {
    const e12 = ema(closes.slice(0, i), 12)
    const e26 = ema(closes.slice(0, i), 26)
    macdValues.push(e12 - e26)
  }
  const macdSignal = ema(macdValues, 9)
  const macdHistogram = macdLine - macdSignal

  const sma20Val = sma(closes, 20)
  const sma50Val = sma(closes, 50)
  const sma200Val = sma(closes, 200)

  const std20 =
    Math.sqrt(
      closes
        .slice(-20)
        .reduce((sum, v) => sum + Math.pow(v - sma20Val, 2), 0) / 20
    ) || 1

  const bollingerUpper = sma20Val + 2 * std20
  const bollingerLower = sma20Val - 2 * std20

  const atr = calculateATR(data)

  const avgVolume20 = sma(volumes, 20)
  const currentVolume = volumes[volumes.length - 1] ?? 0
  const volumeRatio = avgVolume20 > 0 ? currentVolume / avgVolume20 : 1

  return {
    rsi,
    macdLine,
    macdSignal,
    macdHistogram,
    sma20: sma20Val,
    sma50: sma50Val,
    sma200: sma200Val,
    ema12: ema12Val,
    ema26: ema26Val,
    bollingerUpper,
    bollingerMiddle: sma20Val,
    bollingerLower,
    atr,
    priceVsSma20: sma20Val > 0 ? ((currentPrice - sma20Val) / sma20Val) * 100 : 0,
    priceVsSma50: sma50Val > 0 ? ((currentPrice - sma50Val) / sma50Val) * 100 : 0,
    priceVsSma200: sma200Val > 0 ? ((currentPrice - sma200Val) / sma200Val) * 100 : 0,
    volumeRatio,
  }
}

export function getTechnicalScore(indicators: TechnicalIndicators): number {
  let score = 5

  // RSI
  if (indicators.rsi < 30) score += 1.5
  else if (indicators.rsi < 40) score += 0.5
  else if (indicators.rsi > 70) score -= 1.5
  else if (indicators.rsi > 60) score -= 0.5

  // MACD
  if (indicators.macdHistogram > 0) score += 0.5
  else score -= 0.5

  // Moving averages
  if (indicators.priceVsSma20 > 0) score += 0.3
  else score -= 0.3

  if (indicators.priceVsSma50 > 0) score += 0.3
  else score -= 0.3

  if (indicators.priceVsSma200 > 0) score += 0.4
  else score -= 0.4

  // Volume
  if (indicators.volumeRatio > 1.5) score += 0.5
  else if (indicators.volumeRatio < 0.5) score -= 0.3

  return Math.max(1, Math.min(10, Math.round(score * 10) / 10))
}
