import { StockDetailClient } from "./StockDetailClient"
import { ensureLoaded, findStock } from "@/lib/data/stock-registry"
import { notFound } from "next/navigation"
import type { Metadata } from "next"

interface PageProps {
  params: Promise<{ ticker: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { ticker } = await params
  await ensureLoaded()
  const stock = findStock(ticker)
  return {
    title: stock
      ? `${stock.name} (${stock.ticker}) - >koscom InvestHub`
      : "종목 상세 - >koscom InvestHub",
  }
}

export default async function StockDetailPage({ params }: PageProps) {
  const { ticker } = await params
  await ensureLoaded()
  const stock = findStock(ticker)

  if (!stock) {
    notFound()
  }

  return <StockDetailClient ticker={ticker} stockName={stock.name} />
}
