import { StockDetailClient } from "./StockDetailClient"
import { findStock } from "@/lib/constants/stocks"
import { notFound } from "next/navigation"
import type { Metadata } from "next"

interface PageProps {
  params: Promise<{ ticker: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { ticker } = await params
  const stock = findStock(ticker)
  return {
    title: stock
      ? `${stock.name} (${stock.ticker}) - KoreaStockAI`
      : "종목 상세 - KoreaStockAI",
  }
}

export default async function StockDetailPage({ params }: PageProps) {
  const { ticker } = await params
  const stock = findStock(ticker)

  if (!stock) {
    notFound()
  }

  return <StockDetailClient ticker={ticker} stockName={stock.name} />
}
