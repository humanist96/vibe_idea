const KR_TICKER_PATTERN = /^[A-Z0-9]{1,12}$/
const US_TICKER_PATTERN = /^[A-Z0-9]{1,10}$/

export function isValidTicker(
  ticker: string,
  market: "KR" | "US"
): boolean {
  const pattern = market === "KR" ? KR_TICKER_PATTERN : US_TICKER_PATTERN
  return pattern.test(ticker.toUpperCase())
}
