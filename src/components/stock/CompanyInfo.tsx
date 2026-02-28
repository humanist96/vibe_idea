"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import type { CompanyOverview } from "@/lib/api/dart"

interface CompanyInfoProps {
  readonly ticker: string
  readonly stockName: string
  readonly market: string
  readonly sector: string
}

function formatEstDate(est_dt: string | undefined): string {
  if (!est_dt || est_dt.length < 8) return "N/A"
  return `${est_dt.slice(0, 4)}.${est_dt.slice(4, 6)}.${est_dt.slice(6, 8)}`
}

function InfoRow({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div>
      <span className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
        {label}
      </span>
      <p className="mt-0.5 text-sm font-medium text-[var(--color-text-primary)]">
        {value}
      </p>
    </div>
  )
}

export function CompanyInfo({ ticker, stockName, market, sector }: CompanyInfoProps) {
  const [dartInfo, setDartInfo] = useState<CompanyOverview | null>(null)

  useEffect(() => {
    async function fetchCompanyInfo() {
      try {
        const res = await fetch(`/api/stocks/${ticker}/company`)
        const json = await res.json()
        if (json.success) {
          setDartInfo(json.data)
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Failed to fetch DART company info:", error)
        }
      }
    }

    fetchCompanyInfo()
  }, [ticker])

  return (
    <Card className="animate-fade-up stagger-6">
      <CardHeader>
        <CardTitle>기업 정보</CardTitle>
      </CardHeader>
      <div className="grid gap-4 text-sm sm:grid-cols-2">
        <InfoRow label="종목코드" value={ticker} />
        <InfoRow label="시장" value={market} />
        <InfoRow label="섹터" value={sector || "N/A"} />
        {dartInfo ? (
          <>
            <InfoRow label="대표이사" value={dartInfo.ceo_nm} />
            <InfoRow label="설립일" value={formatEstDate(dartInfo.est_dt)} />
            <InfoRow label="업종코드" value={dartInfo.induty_code} />
            {dartInfo.hm_url && (
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
                  홈페이지
                </span>
                <p className="mt-0.5 text-sm font-medium text-[var(--color-accent-400)] truncate">
                  <a
                    href={
                      dartInfo.hm_url.startsWith("http")
                        ? dartInfo.hm_url
                        : `https://${dartInfo.hm_url}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {dartInfo.hm_url}
                  </a>
                </p>
              </div>
            )}
            {dartInfo.adres && (
              <div className="sm:col-span-2">
                <span className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
                  주소
                </span>
                <p className="mt-0.5 text-sm font-medium text-[var(--color-text-primary)]">
                  {dartInfo.adres}
                </p>
              </div>
            )}
          </>
        ) : (
          <InfoRow label="종목명" value={stockName} />
        )}
      </div>
    </Card>
  )
}
