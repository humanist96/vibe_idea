import { Metadata } from "next"
import { USFlowClient } from "@/components/us-stocks/USFlowClient"

export const metadata: Metadata = {
  title: "미국 투자자 동향 | Vibe Idea",
  description: "미국 기관 투자자 보유 현황(13F) 및 섹터별 자금 흐름 분석",
}

export default function USFlowPage() {
  return <USFlowClient />
}
