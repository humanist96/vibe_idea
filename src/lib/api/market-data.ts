import { getQuote, getMultipleQuotes, type StockQuote } from "./naver-finance"
import { STOCK_LIST, findStock } from "@/lib/constants/stocks"

export interface StockWithScore extends StockQuote {
  readonly aiScore: number | null
  readonly sector: string
  readonly market: "KOSPI" | "KOSDAQ"
}

export async function getStockData(ticker: string): Promise<StockWithScore | null> {
  const stockInfo = findStock(ticker)
  if (!stockInfo) return null

  const quote = await getQuote(ticker)

  if (!quote) {
    return {
      ticker: stockInfo.ticker,
      name: stockInfo.name,
      price: 0,
      change: 0,
      changePercent: 0,
      volume: 0,
      marketCap: 0,
      previousClose: 0,
      dayHigh: 0,
      dayLow: 0,
      fiftyTwoWeekHigh: 0,
      fiftyTwoWeekLow: 0,
      per: null,
      pbr: null,
      eps: null,
      dividendYield: null,
      foreignRate: null,
      aiScore: null,
      sector: stockInfo.sector,
      market: stockInfo.market,
    }
  }

  return {
    ...quote,
    name: stockInfo.name,
    aiScore: null,
    sector: stockInfo.sector,
    market: stockInfo.market,
  }
}

export async function getTopStocks(limit = 20): Promise<StockWithScore[]> {
  const tickers = STOCK_LIST.slice(0, limit)
  const quotes = await getMultipleQuotes(tickers.map((t) => t.ticker))

  if (quotes.length > 0) {
    return quotes.map((quote) => {
      const info = STOCK_LIST.find((s) => s.ticker === quote.ticker)
      return {
        ...quote,
        name: info?.name ?? quote.name,
        aiScore: null,
        sector: info?.sector ?? "",
        market: info?.market ?? "KOSPI",
      }
    })
  }

  return tickers.map((info) => ({
    ticker: info.ticker,
    name: info.name,
    price: 0,
    change: 0,
    changePercent: 0,
    volume: 0,
    marketCap: 0,
    previousClose: 0,
    dayHigh: 0,
    dayLow: 0,
    fiftyTwoWeekHigh: 0,
    fiftyTwoWeekLow: 0,
    per: null,
    pbr: null,
    eps: null,
    dividendYield: null,
    foreignRate: null,
    aiScore: null,
    sector: info.sector,
    market: info.market,
  }))
}
