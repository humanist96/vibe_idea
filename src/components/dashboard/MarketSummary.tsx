"use client"

import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { Sparkles } from "lucide-react"

export function MarketSummary() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-500" />
            AI 시장 요약
          </span>
        </CardTitle>
      </CardHeader>
      <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
        <p>
          AI 분석을 시작하려면 개별 종목 페이지에서 &quot;AI 분석&quot; 버튼을 클릭하세요.
          Gemini AI가 기술적 분석, 재무 분석, 시장 심리를 종합하여 1-10 점수를 제공합니다.
        </p>
        <p className="text-xs text-gray-400">
          AI 분석에는 GEMINI_API_KEY 설정이 필요합니다.
          .env.local 파일에 API 키를 추가해주세요.
        </p>
      </div>
    </Card>
  )
}
