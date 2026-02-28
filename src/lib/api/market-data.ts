import { getQuote, getMultipleQuotes, type StockQuote } from "./naver-finance"
import {
  ensureLoaded,
  findStock as registryFindStock,
  getStockEntry,
  getTopStocksFromRegistry,
} from "@/lib/data/stock-registry"
import { STOCK_LIST, findStock as fallbackFindStock } from "@/lib/constants/stocks"

export interface StockWithScore extends StockQuote {
  readonly aiScore: number | null
  readonly sector: string
  readonly market: "KOSPI" | "KOSDAQ"
}

export async function getStockData(ticker: string): Promise<StockWithScore | null> {
  // Try registry first
  await ensureLoaded()
  const stockInfo = registryFindStock(ticker) ?? fallbackFindStock(ticker)
  if (!stockInfo) return null

  const quote = await getQuote(ticker)

  if (!quote) {
    // Use KRX data if available
    const krxEntry = getStockEntry(ticker)
    return {
      ticker: stockInfo.ticker,
      name: stockInfo.name,
      price: krxEntry?.price ?? 0,
      change: krxEntry?.change ?? 0,
      changePercent: krxEntry?.changePercent ?? 0,
      volume: krxEntry?.volume ?? 0,
      marketCap: krxEntry?.marketCap ?? 0,
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
  await ensureLoaded()
  const topEntries = getTopStocksFromRegistry(limit)

  // If registry has data, use it with Naver quotes for detail
  if (topEntries.length > 0) {
    const tickers = topEntries.map((e) => e.ticker)
    const quotes = await getMultipleQuotes(tickers)
    const quoteMap = new Map(quotes.map((q) => [q.ticker, q]))

    return topEntries.map((entry) => {
      const quote = quoteMap.get(entry.ticker)
      if (quote) {
        return {
          ...quote,
          name: entry.name,
          aiScore: null,
          sector: entry.sector,
          market: entry.market,
        }
      }
      return {
        ticker: entry.ticker,
        name: entry.name,
        price: entry.price,
        change: entry.change,
        changePercent: entry.changePercent,
        volume: entry.volume,
        marketCap: entry.marketCap,
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
        sector: entry.sector,
        market: entry.market,
      }
    })
  }

  // Fallback to hardcoded list
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
