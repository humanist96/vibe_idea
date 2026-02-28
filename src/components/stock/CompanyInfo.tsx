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
    <Card>
      <CardHeader>
        <CardTitle>기업 정보</CardTitle>
      </CardHeader>
      <div className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <span className="text-gray-500">종목코드</span>
          <p className="font-medium text-gray-900">{ticker}</p>
        </div>
        <div>
          <span className="text-gray-500">시장</span>
          <p className="font-medium text-gray-900">{market}</p>
        </div>
        <div>
          <span className="text-gray-500">섹터</span>
          <p className="font-medium text-gray-900">{sector}</p>
        </div>
        {dartInfo ? (
          <>
            <div>
              <span className="text-gray-500">대표이사</span>
              <p className="font-medium text-gray-900">{dartInfo.ceo_nm}</p>
            </div>
            <div>
              <span className="text-gray-500">설립일</span>
              <p className="font-medium text-gray-900">
                {formatEstDate(dartInfo.est_dt)}
              </p>
            </div>
            <div>
              <span className="text-gray-500">업종코드</span>
              <p className="font-medium text-gray-900">
                {dartInfo.induty_code}
              </p>
            </div>
            {dartInfo.hm_url && (
              <div>
                <span className="text-gray-500">홈페이지</span>
                <p className="font-medium text-blue-600 truncate">
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
                <span className="text-gray-500">주소</span>
                <p className="font-medium text-gray-900">{dartInfo.adres}</p>
              </div>
            )}
          </>
        ) : (
          <div>
            <span className="text-gray-500">종목명</span>
            <p className="font-medium text-gray-900">{stockName}</p>
          </div>
        )}
      </div>
    </Card>
  )
}
