import { USStockDetailClient } from "./USStockDetailClient"
import { findUSStock } from "@/lib/data/us-stock-registry"
import type { Metadata } from "next"

interface PageProps {
  params: Promise<{ ticker: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { ticker } = await params
  const stock = findUSStock(ticker.toUpperCase())
  return {
    title: stock
      ? `${stock.nameKr} ${stock.symbol} - >koscom InvestHub`
      : `${ticker.toUpperCase()} - >koscom InvestHub`,
  }
}

export default async function USStockDetailPage({ params }: PageProps) {
  const { ticker } = await params

  return <USStockDetailClient ticker={ticker} />
}
